(() => {
  class ParticleOverlay {
    constructor(canvas) {
      this.canvas = canvas;
      this.ctx = canvas.getContext("2d");
      this.particles = [];
      this.running = false;

      // binded loop
      this._loop = this._loop.bind(this);
      requestAnimationFrame(this._loop);
    }

    // Public APIs
    confetti({ x, y, colors, count = 80, power = 1 }) {
      for (let i = 0; i < count; i++) {
        const angle = rand(0, Math.PI * 2);
        const speed = rand(2, 6) * power;
        const size = rand(4, 8);
        const life = rand(0.9, 1.4);
        const color = pick(colors);
        const tilt = rand(-0.5, 0.5);
        this.particles.push(
          new RectParticle(x, y, speed, angle, size, color, life, {
            gravity: 0.15,
            drag: 0.985,
            spin: tilt,
          })
        );
      }
    }

    fireworks({ x, y, colors, count = 80, power = 1 }) {
      // initial explosion outward
      for (let i = 0; i < count; i++) {
        const angle = (i / count) * Math.PI * 2 + rand(-0.05, 0.05);
        const speed = rand(3, 7) * power;
        const size = rand(2, 4);
        const life = rand(0.8, 1.2);
        const color = pick(colors);
        this.particles.push(
          new CircleParticle(x, y, speed, angle, size, color, life, {
            gravity: 0.12,
            drag: 0.992,
            twinkle: true,
          })
        );
      }

      // secondary smaller white particles
      for (let i = 0; i < count / 3; i++) {
        const angle = rand(0, Math.PI * 2);
        const speed = rand(1, 3) * power;
        const size = rand(1, 2);
        const life = rand(0.6, 0.9);
        const color = "#ffffff";
        this.particles.push(
          new CircleParticle(x, y, speed, angle, size, color, life, {
            gravity: 0.05,
            drag: 0.99,
            fadeEarly: true,
          })
        );
      }
    }

    balloons({ x, y, colors, count = 20, power = 1 }) {
      for (let i = 0; i < count; i++) {
        const angle = rand(-Math.PI / 8, Math.PI / 8);
        const speed = rand(0.8, 1.6) / power;
        const size = rand(8, 12);
        const life = rand(2.5, 3.5);
        const color = pick(colors);
        this.particles.push(
          new BalloonParticle(x, y, speed, angle, size, color, life, {
            buoyancy: -0.06,
            wobble: rand(0.004, 0.01),
          })
        );
      }
    }

    _loop() {
      const ctx = this.ctx;
      const canvas = this.canvas;

      // clear with small alpha to get trails
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const now = performance.now() / 1000; // in seconds
      this.particles = this.particles.filter((p) => !p.dead);
      for (const p of this.particles) {
        p.update(1 / 60, now);
      }
      for (const p of this.particles) {
        p.draw(ctx);
      }

      requestAnimationFrame(this._loop);
    }
  }

  class BaseParticle {
    constructor(x, y, speed, angle, size, color, life, opts = {}) {
      this.x = x;
      this.y = y;
      this.vx = Math.cos(angle) * speed;
      this.vy = Math.sin(angle) * speed;
      this.size = size;
      this.color = color;
      this.life = life;
      this.age = 0;
      this.dead = false;
      this.opts = opts;
      this.alpha = 1;
      this.rotation = rand(0, Math.PI * 2);
      this.spin = opts.spin || 0;
    }

    physics(dt) {
      const drag = this.opts.drag ?? 0.99;
      const gravity = this.opts.gravity ?? 0;

      this.vx *= drag;
      this.vy *= drag;
      this.vy += gravity;

      this.x += this.vx;
      this.y += this.vy;

      this.rotation += this.spin;
    }

    update(dt) {
      this.age += dt;
      if (this.age >= this.life) this.dead = true;
      if (this.opts.fadeEarly)
        this.alpha = Math.max(0, 1 - this.age / this.life);
      this.physics(dt);
    }
  }

  class RectParticle extends BaseParticle {
    draw(ctx) {
      ctx.save();
      ctx.globalAlpha = this.alpha;
      ctx.translate(this.x, this.y);
      ctx.rotate(this.rotation);
      ctx.fillStyle = this.color;
      ctx.fillRect(-this.size / 2, -this.size / 2, this.size, this.size * 0.6);
      ctx.restore();
    }
  }

  class CircleParticle extends BaseParticle {
    update(dt, now) {
      super.update(dt);
      if (this.opts.twinkle) {
        // twinkle by modulating alpha
        this.alpha = 0.6 + 0.4 * Math.sin(this.age * 20 + this.size);
      }
    }
    draw(ctx) {
      ctx.save();
      ctx.globalAlpha = Math.max(0, this.alpha);
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      ctx.fillStyle = this.color;
      ctx.fill();
      ctx.restore();
    }
  }

  class BalloonParticle extends BaseParticle {
    update(dt) {
      this.vy += this.opts.buoyancy ?? -0.05; // rise
      // gentle horizontal wobble
      this.vx +=
        Math.sin((this.age + this.size) * 4) * (this.opts.wobble ?? 0.006);
      super.update(dt);
      // balloons fade near the end
      const t = this.age / this.life;
      this.alpha = Math.max(0, 1 - Math.pow(t, 1.5));
    }
    draw(ctx) {
      // Draw oval balloon + simple string
      ctx.save();
      ctx.globalAlpha = this.alpha;
      ctx.translate(this.x, this.y);
      ctx.rotate(this.rotation * 0.1);

      // balloon
      ctx.beginPath();
      ctx.ellipse(0, 0, this.size, this.size * 1.3, 0, 0, Math.PI * 2);
      ctx.fillStyle = this.color;
      ctx.fill();

      // tie
      ctx.beginPath();
      ctx.moveTo(0, this.size * 1.3);
      ctx.lineTo(0, this.size * 1.6);
      ctx.strokeStyle = "rgba(0,0,0,0.25)";
      ctx.lineWidth = 1;
      ctx.stroke();

      // string
      ctx.beginPath();
      ctx.moveTo(0, this.size * 1.6);
      ctx.quadraticCurveTo(3, this.size * 2.2, 0, this.size * 2.8);
      ctx.stroke();

      ctx.restore();
    }
  }

  // utils
  const rand = (a, b) => a + Math.random() * (b - a);
  const pick = (arr) => arr[(Math.random() * arr.length) | 0];

  // expose
  window.ParticleOverlay = ParticleOverlay;
})();
