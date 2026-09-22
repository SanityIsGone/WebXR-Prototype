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

class Ray {
    constructor(physics, origin, direction, limit) {
        this.physics = physics;

        this.origin = origin;
        this.direction = direction;
        this.direction.normalize();
        this.limit = limit;

        this.raycaster = new THREE.Raycaster();

        this.hit = null;
        this.position = null;
        this.body = null;

        // Visual ray
        this.visual = document.createElement("a-entity");
        this.visual.setAttribute("line", {
            start: `${origin.x} ${origin.y} ${origin.z}`,
            end: `${origin.x + direction.x * limit} ${origin.y + direction.y * limit} ${origin.z + direction.z * limit}`,
            color: "#00ffff"
        });

        physics.scene.appendChild(this.visual);
    }

    update() {
        this.raycaster.set(
            this.origin,
            this.direction
        );

        this.raycaster.far = this.limit;

        const intersections =
            this.raycaster.intersectObjects(
                this.physics.scene.object3D.children,
                true
            );

        if (intersections.length > 0) {
            const intersection = intersections[0];

            this.hit = intersection.object;
            this.position = intersection.point;

            if (this.hit.el && this.hit.el.body) {
                this.body = new Body(this.hit.el);
            } else {
                this.body = null;
            }
        } else {
            this.hit = null;
            this.position = null;
            this.body = null;
        }

        // Update visual ray
        const end = this.position ?? new THREE.Vector3(
            this.origin.x + this.direction.x * this.limit,
            this.origin.y + this.direction.y * this.limit,
            this.origin.z + this.direction.z * this.limit
        );

        this.visual.setAttribute("line", {
            start: `${this.origin.x} ${this.origin.y} ${this.origin.z}`,
            end: `${end.x} ${end.y} ${end.z}`,
            color: "#00ffff"
        });
    }

    destroy() {
        this.physics.rays.delete(this);
        this.visual.remove();
    }
}

class Physics {
    constructor() {
        this.world = null;
        this.gravity = new Gravity(this);
        this.body = {};
        this.rays = new Set();
        this.scene = null;
    }

    getBody(id) {
        const element = document.querySelector(`#${id}`);

        if (!element || !element.body) {
            return null;
        }

        return new Body(element);
    }

    raycast(origin, direction, limit) {
        const ray = new Ray(
            this,
            origin,
            direction,
            limit
        );

        this.rays.add(ray);

        ray.update();

        return ray;
    }

    tick() {
        for (const ray of this.rays) {
            ray.update();
        }
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