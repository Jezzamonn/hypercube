export default class Controller {

	constructor() {
		this.animAmt = 0;
		this.period = 5;

		this.dimensions = 3;

		this.hyperPoints = [[]];

		for (let i = 0; i < this.dimensions; i++) {
			this.hyperPoints = appendPermutations([-1, 1], this.hyperPoints);
		}

		this.dimensionProjections = [];
		for (let i = 0; i < this.dimensions; i++) {
			const amt = i / this.dimensions;
			const angle = Math.PI * amt;
			const projection = {
				x: Math.cos(angle),
				y: Math.sin(angle),
			}
			this.dimensionProjections.push(projection);
		}
	}

	/**
	 * Simulate time passing.
	 *
	 * @param {number} dt Time since the last frame, in seconds 
	 */
	update(dt) {
		this.animAmt += dt / this.period;
		this.animAmt %= 1;
	}

	/**
	 * Render the current state of the controller.
	 *
	 * @param {!CanvasRenderingContext2D} context
	 */
	render(context) {
		let rotMatrix = identity(this.dimensions);
		for (let i = 0; i < this.dimensions - 1; i++) {
			const subRotation = rotationMatrix(
				this.dimensions,
				i,
				i + 1,
				2 * Math.PI * this.animAmt
			);
			rotMatrix = matrixMul(subRotation, rotMatrix);
		}

		for (const p1 of this.hyperPoints) {
			for (const p2 of this.hyperPoints) {
				if (p1 === p2) {
					continue;
				}

				if (l1dist(p1, p2) !== 2) {
					// just drawing these lines
					continue;
				}

				const rotatedP1 = matrix2Vec(matrixMul(rotMatrix, vec2Matrix(p1)));
				const rotatedP2 = matrix2Vec(matrixMul(rotMatrix, vec2Matrix(p2)));

				const point2d1 = get2dProjectedPoint(rotatedP1, this.dimensionProjections);
				const point2d2 = get2dProjectedPoint(rotatedP2, this.dimensionProjections);

				const size = 50;

				context.beginPath();
				context.strokeStyle = 'black';
				context.moveTo(size * point2d1.x, size * point2d1.y);
				context.lineTo(size * point2d2.x, size * point2d2.y);
				context.stroke();
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