import { easeInOut } from './util';

const PHI = (1 + Math.sqrt(5)) / 2;

export default class Controller {

	constructor() {
		this.animAmt = 0;
		this.shapeTime = 2;
		this.dimensions = [1, 2, 3, 4];
		this.period = this.dimensions.length * this.shapeTime;

		this.setNumberOfDimensions(4);
	}

	setNumberOfDimensions(dim) {
		this.currentDimension = dim;

		this.hyperPoints = [[]];

		for (let i = 0; i < this.currentDimension; i++) {
			this.hyperPoints = appendPermutations([-1, 1], this.hyperPoints);
		}

		this.dimensionProjections = [];
		for (let i = 0; i < this.currentDimension; i++) {
			const amt = i / this.dimensions.length;
			const angle = Math.PI * amt;
			const projection = {
				x: Math.cos(angle),
				y: -Math.sin(angle),
			}
			this.dimensionProjections.push(projection);
		}

		this.baseRotation = identity(this.currentDimension);
		// for (let i = 0; i < this.dimensions - 1; i++) {
		// 	const subRotation = rotationMatrix(
		// 		this.dimensions,
		// 		i,
		// 		i + 1,
		// 		2 * Math.PI * Math.random(),
		// 	);
		// 	this.baseRotation = matrixMul(subRotation, this.baseRotation);
		// }
	}

	/**
	 * Simulate time passing.
	 *
	 * @param {number} dt Time since the last frame, in seconds 
	 */
	update(dt) {
		this.animAmt += dt / this.period;
		this.animAmt %= 1;

		const dimensionIndex = Math.floor(this.dimensions.length * this.animAmt);
		const desiredDimension = this.dimensions[dimensionIndex];
		if (desiredDimension != this.currentDimension) {
			this.setNumberOfDimensions(desiredDimension);
		}
	}

	/**
	 * Render the current state of the controller.
	 *
	 * @param {!CanvasRenderingContext2D} context
	 */
	render(context) {
		this.renderHypercube(context);
		context.translate(-200, 230);
		this.renderAxis(context);
	}

	/**
	 * @param {!CanvasRenderingContext2D} context
	 */
	renderAxis(context) {
		const scale = 60;
		for (let i = 0; i < this.currentDimension; i++) {
			const p = [];
			for (let j = 0; j < this.currentDimension; j++) {
				p.push(0);
			}
			p[i] = 1;

			const p2d = get2dProjectedPoint(p, this.dimensionProjections);

			const startAlpha = context.globalAlpha;
			context.globalAlpha = 1;
			context.beginPath();
			context.strokeStyle = getColor(i);
			context.lineWidth = 1;
			context.moveTo(0, 0);
			context.lineTo(scale * p2d.x, scale * p2d.y);

			// the arrow head
			context.moveTo(
				0.9 * scale * p2d.x - 0.05 * scale * p2d.y,
				0.9 * scale * p2d.y + 0.05 * scale * p2d.x
			);
			context.lineTo(scale * p2d.x, scale * p2d.y);
			context.lineTo(
				0.9 * scale * p2d.x + 0.05 * scale * p2d.y,
				0.9 * scale * p2d.y - 0.05 * scale * p2d.x
			);
			context.stroke();

			context.fillStyle = getColor(i);
			context.fillText(
				getDimensionLabel(i),
				1.1 * scale * p2d.x,
				1.1 * scale * p2d.y
			);

			context.globalAlpha = startAlpha;
		}
	}

	/**
	 * @param {!CanvasRenderingContext2D} context
	 */
	renderHypercube(context) {
		const localAnimAmt = (this.dimensions.length * this.animAmt) % 1;
		let rotMatrix = this.baseRotation;
		for (let i = 0; i < this.currentDimension - 1; i++) {
			const subRotation = rotationMatrix(
				this.currentDimension,
				i,
				i + 1,
				2 * Math.PI * localAnimAmt
			);
			rotMatrix = matrixMul(subRotation, rotMatrix);
		}
		// Also scale the last dimension
		const scaleMatrix = identity(this.currentDimension);
		scaleMatrix[this.currentDimension-1][this.currentDimension-1] = easeInOut(localAnimAmt, 2);

		for (let i = 0; i < this.hyperPoints.length; i++) {
			const p1 = this.hyperPoints[i];
			for (let j = i + 1; j < this.hyperPoints.length; j++) {
				const p2 = this.hyperPoints[j];

				if (l1dist(p1, p2) !== 2) {
					// just drawing these lines
					continue;
				}

				const rotatedP1 = matrix2Vec(matrixMul(scaleMatrix, vec2Matrix(p1)));
				const rotatedP2 = matrix2Vec(matrixMul(scaleMatrix, vec2Matrix(p2)));

				const point2d1 = get2dProjectedPoint(rotatedP1, this.dimensionProjections);
				const point2d2 = get2dProjectedPoint(rotatedP2, this.dimensionProjections);

				const size = 30;

				const startAlpha = context.globalAlpha;
				context.globalAlpha = 0.75;
				context.beginPath();
				context.strokeStyle = 'black';
				context.lineWidth = 1;
				context.moveTo(size * point2d1.x, size * point2d1.y);
				context.lineTo(size * point2d2.x, size * point2d2.y);
				context.stroke();
				context.globalAlpha = startAlpha;
			}
		}

	}

}

/**
 * @param {Array<*>} options Things to append, e.g. [-1, 1]
 * @param {Array<Array<*>>} bases Arrays of other things, e.g. [[-1], [1]]
 * @returns {Array<Array<*>>} Something like [[-1, -1], [-1, 1], [1, -1], [1, 1]]
 */
function appendPermutations(options, bases) {
	const results = [];
	for (const option of options) {
		for (const base of bases) {
			const result = [option, ...base]
			results.push(result);
		}
	}
	return results;
}

/**
 * I think L1 dist is the term I'm looking for. Sum of all the abs differences
 * @param {Array<number>} p1
 * @param {Array<number>} p2
 */
function l1dist(p1, p2) {
	if (p1.length != p2.length) {
		throw new Error("No");
	}

	let diff = 0;
	for (let i = 0; i < p1.length; i++) {
		diff += Math.abs(p1[i] - p2[i]);
	}
	return diff;
}

/**
 * 
 * @param {Array<number>} p 
 * @param {Array<{x: number, y: number}} projections
 * @returns {{x: number, y: number}}
 */
function get2dProjectedPoint(p, projections) {
	let point2d = {x: 0, y: 0}
	for (let i = 0; i < p.length; i++) {
		point2d.x += projections[i].x * p[i];
		point2d.y += projections[i].y * p[i];
	}
	return point2d;
}

function identity(dim) {
	const matrix = [];
	// generate the identity matrix
	for (let i = 0; i < dim; i++) {
		const row = [];
		for (let j = 0; j < dim; j++) {
			row.push(i === j ? 1 : 0);
		}
		matrix.push(row);
	}
	return matrix;
}

/**
 * @param {number} dim1 x-axis. i.e. columns. Maybe backwards from what you'd think
 * @param {number} dim2 y-axis, i.e. Rows.
 */
function zeros(dim1, dim2) {
	const matrix = [];
	for (let y = 0; y < dim2; y++) {
		const row = [];
		for (let x = 0; x < dim1; x++) {
			row.push(0);
		}
		matrix.push(row);
	}
	return matrix;
}

function rotationMatrix(dimensions, dim1, dim2, angle) {
	const matrix = identity(dimensions);
	// // have no idea which way the signs and such go on these
	matrix[dim1][dim1] = Math.cos(angle);
	matrix[dim1][dim2] = Math.sin(angle);
	matrix[dim2][dim1] = -Math.sin(angle);
	matrix[dim2][dim2] = Math.cos(angle);
	return matrix;
}

/**
 * I kinda forgot how matrix multiplication works but I think this is it.
 *
 * @param {Array<Array<number>>} mat1
 * @param {Array<Array<number>>} mat2
 */
function matrixMul(mat1, mat2) {
	// the order of these is weird because I'm sticking to the x / y thing
	// instead of rows / cols
	const result = zeros(mat2[0].length, mat1.length);
	// each row in the first matrix
	for (let i = 0; i < mat1.length; i++) {
		// each column in the first matrix / each row in the second matrix
		for (let j = 0; j < mat1[0].length; j++) {
			// each column in the second matrix
			for (let k = 0; k < mat2[0].length; k++) {
				result[i][k] += mat1[i][j] * mat2[j][k]
			}
		}
	}
	return result;
}

function vec2Matrix(vec) {
	const result = [];
	for (const el of vec) {
		result.push([el]);
	}
	return result;
}

function matrix2Vec(matrix) {
	const result = [];
	for (const row of matrix) {
		result.push(row[0]);
	}
	return result;
}

function getDimensionLabel(dim) {
	const labels = ['x', 'y', 'z', 'u', 'v', 'w'];
	if (dim < labels.length) {
		return labels[dim];
	}
	return '?';
}

function getColor(dim) {
	// Bye bye color
	return 'black';
}