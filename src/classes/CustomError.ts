export class AniError extends Error {
	constructor(message: string) {
			super(message);
			this.name = this.constructor.name;
			Error.captureStackTrace(this, this.constructor);
	}
}

export class NotFoundError extends AniError {
	constructor(message: string = "Resource not found") {
			super(message);
	}
}

export class ValidationError extends AniError {
	constructor(message: string = "Invalid input") {
			super(message);
	}
}
