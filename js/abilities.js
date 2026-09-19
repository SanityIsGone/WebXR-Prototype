// =============================================
// Spell Data
// =============================================

// Examples:
// target.health -= Kyma.damage;
// focus.current -= Elxi.getFocusCost(skill.level) / 10;

class Spell {
    constructor({
        name, // name of the spell
        difficulty, // defines a spell's difficulty (higher-difficulty spells drain more focus)
        damage = 0, // defines a spell's base damage when it hits a target (a miss means no damage). A spell's damage can usually be increased through various means.
        waterVolume, // defines how much water a spell requires to cast. For some spells, this value can increase or decrease mid-casting
        focusDrain, // a value used in tandem with difficulty and waterVolume to help determine how much of the player's focus is drained
        duration = 0, // controls a spell's lifetime for instant spells. This value should be ignored for sustained spells
        xpGain, // defines how much the spell contributes to the player's skill for the particular spell. The more the player casts this spell, the lower this value becomes
        skill = 0, // works in tandem with xpGain to help. Each successful cast increases the spell's skill, which lowers xpGain
        count = 1, // defines how many features the spell casts. For example, Trikymia Lonchis can cast 1 - 3 projectiles.
        strength = 5, // an attribute unique to Asfalis; defines how much damage the shield can sustain before it breaks. This value can go up to 25.
        radius = 0 // defines how large of an area the spell affects or how many targets can be affected. Behavior differs slightly per spell.

    }) {
        this.name = name;
        this.difficulty = difficulty;
        this.damage = damage;
        this.waterVolume = waterVolume;
        this.focusDrain = focusDrain;
        this.duration = duration;
        this.xpGain = xpGain;
        this.skill = skill;
        this.count = count;
        this.strength = strength;
        this.radius = radius;
    }

    // computes how much focus a spell should use when it is casted
    // this.difficulty means harder spells drain more focus;
    // this.focusDrain is the spell's intrinsic drain (usually <1 for sustained spells and >1 for instant spells);
    // and this.waterVolume means that spells which require more water will drain more focus

    getFocusCost(skillLevel = 0) {
        const cost =
            (this.difficulty +
            this.focusDrain +
            this.waterVolume) -
            skillLevel;

        return Math.max(0, cost);
    }
}

// ─────────────────────────────────────────────
// Spell Definitions
// ─────────────────────────────────────────────

const Elxi = new Spell({
    name: "Elxi",
    difficulty: 3,
    damage: 0,
    waterVolume: 5,
    focusDrain: 0.2, // Elxi is sustained, so use a smaller value of focusDrain so as to not drain it all in one second
    //Elxi is sustained, so it doesn't use the duration property
    xpGain: 800, // Elxi adds 800 experience to the player's overall experience when they first learn it; the value decreases as Elxi.skill increases
    // When the player first starts the game, 1000 experience points are required to level up. From then on, it becomes harder to level up, requiring more XP
    skill: 0, // the player's skill with a spell starts at 0 when they first learn the spell; the value increases based on how many successful casts the player does
    //Elxi doesn't use the count property
    radius: 1, // Elxi's radius is 1; this means only a single target can be affected
});

const Kyma = new Spell({
    name: "Kyma",
    difficulty: 2,
    damage: 2, // Kyma's base damage is 2. This value can change based on circumstances and skill.
    waterVolume: 5, // Kyma's base size is 5. This value will gradually increase as Kyma.skill increases, going to a max of 20
    focusDrain: 3, // Kyma is instant, so use a larger value of focusDrain so that it drains a reasonable amount of focus
    duration: 1, // Kyma lasts for 1 second after casting
    xpGain: 500,
    radius: 1 // Kyma's base radius is 1; this means the wave's size is only enough to damage one person
    // This value can go up to 5, but the damage will be distributed across the wave;
    // so a greater radius results in lower damage to each target, but it can damage more targets
});

const Othisi = new Spell({
    name: "Othisi",
    difficulty: 5,
    damage: 5, // the spell by itself may damage only 5HP, but if a target is pushed into a wall... more bones will be broken
    waterVolume: 5,
    focusDrain: 4,
    duration: 1,
    xpGain: 1000,
    radius: 1 // base radius is 1; can be increased with skill to push more targets.
    // For Othisi, this value increases the angle; 1 is 20°; 3 (the max for this spell) is 60°
});

const Ydrosphera = new Spell({
    name: "Ydrosphera",
    difficulty: 5,
    damage: 0, // unlike many spells, a larger orb will increase the damage. This spell can touch a target without damaging them, if the player is careful
    waterVolume: 2, // Ydrosphera's base size is 2; this value can increase if the player grows the orb
    // (it can technically become as large as it wants, assuming the player can hold his arms that far apart XD)
    focusDrain: 0.1, // sustained
    xpGain: 1000,
    // no radius needed, since the orb functions as the damaging collision body and is determined by waterVolume
});

const Rigma = new Spell({
    name: "Rigma",
    difficulty: 7,
    damage: 5,
    waterVolume: 5, // since Rigma utilizes condensed water, its volume is actually greater than what it seems
    focusDrain: 4, // instant
    duration: 1,
    xpGain: 1200,
    radius: 1 // only one target can be affected. This value does not change for Rigma
});

const Nerofos = new Spell({
    name: "Nerofos",
    difficulty: 7,
    waterVolume: 2, // ordinarily, a sphere of this size would use 1. Yet once again, Nerofos requires compression
    focusDrain: 0.2, // sustained
    xpGain: 1200,
    radius: 0.5 // determines how bright/how much space the spell's glow affects. Starts at 0.5 meters, can go to 2.5 meters
});

const Trikymia_Lonchis = new Spell({
    name: "Trikymia_Lonchis",
    difficulty: 10,
    damage: 15, // unlike most spells, the damage multiplies per projectile that hits a target
    waterVolume: 5, // once again, the volume multiplies per projectile casted
    focusDrain: 8, // instant; multiplies per projectile
    duration: 3, // projectiles can last 3 seconds; if they hit nothing after 3 seconds, they dissipate
    xpGain: 2000,
    count: 1, // default value of one projectile; this value can increase with skill.
    radius: 1 // determines the spread of the projectiles; they can be focused (1) or scatter-spread (2-3)
    // the radius can only go above 1 if there is more than 1 projectile.
});

const Dini_Lepidon = new Spell({
    name: "Dini_Lepidon",
    difficulty: 10,
    damage: 15, // once again, the damage multiplies per blade that hits a target
    waterVolume: 5, // once again, the volume multiplies per blade casted
    focusDrain: 0.6, // sustained; multiplies per blade
    xpGain: 2500,
    count: 1 // default value of one blade; this value can increase with skill
});

const Ekriksi = new Spell({
    name: "Ekriksi",
    difficulty: 12,
    damage: 15, // greater size = greater damage; damage can go up to 75 at its center
    waterVolume: 10, // similar to Ydrosphera in that the player can increase its size
    focusDrain: 0.7, // sustained
    xpGain: 3000,
    radius: 0.5 // determines blast radius of the spell. Minimum is 0.5 meters (1m diameter); can go up to 2.5 radius (5m diameter)
});

const Desma = new Spell({
    name: "Desma",
    difficulty: 12,
    damage: 0, // the spell can be used without damaging a target; throwing the target against a surface can deal up to 30HP
    waterVolume: 8,
    focusDrain: 0.7, // sustained
    xpGain: 3500,
});

const Asfalis = new Spell({
    name: "Asfalis",
    difficulty: 14,
    waterVolume: 10,
    focusDrain: 0.8, // sustained
    xpGain: 4000,
    radius: 0.5, // the shield starts out with a 1m diameter; can extend to 2.5m radius (5m diameter) to protect multiple targets.
    strength: 10 // how much damage the shield can withstand before breaking. Base is 10HP; max is 50HP
    // Larger radius uses more water and weakens the shield's strength.
});

const Katarraktis = new Spell({
    name: "Katarraktis",
    difficulty: 16,
    damage: 50, // cannot change
    waterVolume: 20,
    focusDrain: 1, // sustained
    xpGain: 5000,
});



// =============================================
// Spell Gesture Detection
// =============================================

