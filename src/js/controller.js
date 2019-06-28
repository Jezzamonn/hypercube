export default class Controller {

	constructor() {
		this.animAmt = 0;
		this.period = 3;

		this.dimensions = 2;

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
		for (const p1 of this.hyperPoints) {
			for (const p2 of this.hyperPoints) {
				if (p1 === p2) {
					continue;
				}

				if (l1dist(p1, p2) !== 2) {
					// just drawing these lines
					continue;
				}

				const point2d1 = get2dProjectedPoint(p1, this.dimensionProjections);
				const point2d2 = get2dProjectedPoint(p2, this.dimensionProjections);

				context.beginPath();
				context.strokeStyle = 'black';
				context.moveTo(100 * point2d1.x, 100 * point2d1.y);
				context.lineTo(100 * point2d2.x, 100 * point2d2.y);
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