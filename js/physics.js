// A-Frame physics file. Used for the VR physics of the project.

class Body {
    constructor(element) {
        this.element = element;
    }

    get mass() {
        return this.element.body.mass;
    }

    set mass(value) {
        this.element.body.mass = value;
        this.element.body.updateMassProperties();
    }

    get position() {
        return this.element.body.position;
    }

    get velocity() {
        return this.element.body.velocity;
    }

    applyVelocity(direction, strength) {
        this.element.body.velocity.x += direction.x * strength;
        this.element.body.velocity.y += direction.y * strength;
        this.element.body.velocity.z += direction.z * strength;
    }
}

class Gravity {
    constructor(physics) {
        this.physics = physics;
        this._strength = 0;
    }

    get strength() {
        return this._strength;
    }

    set strength(value) {
        this._strength = value;

        const world = this.physics.world;

        if (world) {
            world.gravity.set(0, -value, 0);
        }
    }
}

class Physics {
    constructor() {
        this.world = null;
        this.gravity = new Gravity(this);
        this.body = {};
        this.scene = null;
    }

    getBody(id) {
        const element = document.querySelector(`#${id}`);

        if (!element || !element.body) {
            return null;
        }

        return new Body(element);
    }

    init() {
        const scene = document.querySelector("a-scene");

        this.scene = scene;
        this.world = scene.systems.physics.driver.world;

        this.gravity.strength = 9.81;

        this.body.ball = new Body(
            document.querySelector("#ball")
        );

        this.body.ground = new Body(
            document.querySelector("#ground-physics")
        );
    }
}

export const physics = new Physics();

const scene = document.querySelector("a-scene");

scene.addEventListener("loaded", () => {
    physics.init();

    scene.addEventListener("tick", () => {
        physics.tick();
    });

    const ball = document.querySelector("#ball");

    ball.addEventListener("body-loaded", () => {
        physics.body.ball.velocity.set(0, 0, 0);
    
        console.log(
            "BODY LOADED VELOCITY:",
            physics.body.ball.velocity
        );
    });
    
    setInterval(() => {
        const cannonBody = physics.body.ball.element.body;
    
        console.log();
    }, 100);
});