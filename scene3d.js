/* ===========================================================
   3D Stadium Scene — built entirely from primitive Three.js
   geometry (no external models), so everything is original.
   =========================================================== */

function createScene3D() {
 return {
  renderer: null, scene: null, camera: null,
  ball: null, bowlerFig: null, batsmanFig: null,
  clock: null,
  canvasEl: null,
  cameraMode: 'bowler', // bowler | batter | ball | wide
  _ballAnim: null,

  init(canvas) {
    this.canvasEl = canvas;
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.resize();

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0a1830);
    this.scene.fog = new THREE.Fog(0x0a1830, 60, 160);

    this.camera = new THREE.PerspectiveCamera(60, this._aspect(), 0.1, 500);
    this.camera.position.set(0, 6, 24);

    this._buildLights();
    this._buildGround();
    this._buildPitch();
    this._buildStumps();
    this._buildStadium();
    this._buildSky();
    this._buildFigures();

    this.ball = this._buildBall();
    this.scene.add(this.ball);

    this.clock = new THREE.Clock();
    window.addEventListener('resize', () => this.resize());
    this._animate();
  },

  _aspect() { return this.canvasEl.clientWidth / Math.max(1, this.canvasEl.clientHeight); },

  resize() {
    const w = this.canvasEl.clientWidth, h = this.canvasEl.clientHeight;
    this.renderer.setSize(w, h, false);
    if (this.camera) { this.camera.aspect = w / Math.max(1, h); this.camera.updateProjectionMatrix(); }
  },

  _buildLights() {
    const amb = new THREE.AmbientLight(0x8899bb, 0.55);
    this.scene.add(amb);
    const sun = new THREE.DirectionalLight(0xffffff, 0.6);
    sun.position.set(30, 50, 10);
    sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024);
    this.scene.add(sun);

    // Floodlights (4 corner towers)
    const positions = [[45, 30, 45], [-45, 30, 45], [45, 30, -45], [-45, 30, -45]];
    positions.forEach(p => {
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 30, 8), new THREE.MeshStandardMaterial({ color: 0x333333 }));
      pole.position.set(p[0], p[1] / 2, p[2]);
      this.scene.add(pole);
      const head = new THREE.Mesh(new THREE.BoxGeometry(4, 2, 1), new THREE.MeshStandardMaterial({ color: 0x222222, emissive: 0xffffaa, emissiveIntensity: 0.3 }));
      head.position.set(p[0], p[1] + 1, p[2]);
      this.scene.add(head);
      const light = new THREE.PointLight(0xfff4d6, 0.8, 120);
      light.position.set(p[0], p[1], p[2]);
      this.scene.add(light);
    });
  },

  _buildGround() {
    const geo = new THREE.CircleGeometry(50, 64);
    const mat = new THREE.MeshStandardMaterial({ color: 0x1e7a2e });
    const ground = new THREE.Mesh(geo, mat);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    this.scene.add(ground);

    // boundary rope
    const ropeGeo = new THREE.RingGeometry(38.6, 39, 64);
    const ropeMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const rope = new THREE.Mesh(ropeGeo, ropeMat);
    rope.rotation.x = -Math.PI / 2;
    rope.position.y = 0.02;
    this.scene.add(rope);

    // 30-yard circle
    const circ = new THREE.RingGeometry(19.6, 20, 64);
    const circMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.5 });
    const c30 = new THREE.Mesh(circ, circMat);
    c30.rotation.x = -Math.PI / 2;
    c30.position.y = 0.02;
    this.scene.add(c30);
  },

  _buildPitch() {
    const geo = new THREE.PlaneGeometry(4.2, 20);
    const mat = new THREE.MeshStandardMaterial({ color: 0xC9B48A });
    const pitch = new THREE.Mesh(geo, mat);
    pitch.rotation.x = -Math.PI / 2;
    pitch.position.y = 0.01;
    pitch.receiveShadow = true;
    this.scene.add(pitch);

    // creases
    [-9.6, 9.6].forEach(z => {
      const crease = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 0.08), new THREE.MeshBasicMaterial({ color: 0xffffff }));
      crease.rotation.x = -Math.PI / 2;
      crease.position.set(0, 0.02, z);
      this.scene.add(crease);
    });
  },

  _buildStumps() {
    this.stumpsBowlerEnd = this._makeStumpSet();
    this.stumpsBowlerEnd.position.set(0, 0, -10);
    this.scene.add(this.stumpsBowlerEnd);

    this.stumpsBatEnd = this._makeStumpSet();
    this.stumpsBatEnd.position.set(0, 0, 10);
    this.scene.add(this.stumpsBatEnd);
  },

  _makeStumpSet() {
    const group = new THREE.Group();
    const mat = new THREE.MeshStandardMaterial({ color: 0xf3e6c8 });
    [-0.35, 0, 0.35].forEach(x => {
      const stump = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.9, 8), mat);
      stump.position.set(x, 0.45, 0);
      stump.castShadow = true;
      group.add(stump);
    });
    const bail1 = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.05, 0.05), mat);
    bail1.position.set(-0.18, 0.92, 0);
    group.add(bail1);
    const bail2 = bail1.clone();
    bail2.position.set(0.18, 0.92, 0);
    group.add(bail2);
    return group;
  },

  _buildStadium() {
    // simple tiered stands as a ring of boxes with crowd-color speckle texture via vertex colors
    const standGroup = new THREE.Group();
    const segments = 40;
    for (let i = 0; i < segments; i++) {
      const angle = (i / segments) * Math.PI * 2;
      const radius = 44;
      const x = Math.cos(angle) * radius, z = Math.sin(angle) * radius;
      const color = Math.random() > 0.5 ? 0xdd4444 : (Math.random() > 0.5 ? 0x4477dd : 0xdddd44);
      const seg = new THREE.Mesh(
        new THREE.BoxGeometry(6.5, 8, 3),
        new THREE.MeshStandardMaterial({ color })
      );
      seg.position.set(x, 4, z);
      seg.lookAt(0, 4, 0);
      this.scene.add(seg);
    }
    this.scene.add(standGroup);

    // ad boards (fictional brands) around the rope
    const brands = ['NOVA SPORTS', 'ZENTA', 'BLUE PEAK', 'STRIKE COLA', 'APEX GEAR'];
    for (let i = 0; i < brands.length; i++) {
      const angle = (i / brands.length) * Math.PI * 2;
      const radius = 40.5;
      const x = Math.cos(angle) * radius, z = Math.sin(angle) * radius;
      const board = new THREE.Mesh(new THREE.BoxGeometry(6, 1.4, 0.2), new THREE.MeshStandardMaterial({ color: 0x111133 }));
      board.position.set(x, 1, z);
      board.lookAt(0, 1, 0);
      this.scene.add(board);
    }

    // scoreboard structure (visual only, actual score shown in HTML HUD)
    const board = new THREE.Mesh(new THREE.BoxGeometry(10, 5, 0.5), new THREE.MeshStandardMaterial({ color: 0x061428, emissive: 0x0a2a4a, emissiveIntensity: 0.4 }));
    board.position.set(0, 10, -30);
    this.scene.add(board);
  },

  _buildSky() {
    const geo = new THREE.SphereGeometry(150, 32, 32);
    const mat = new THREE.MeshBasicMaterial({ color: 0x0d1b34, side: THREE.BackSide });
    const sky = new THREE.Mesh(geo, mat);
    this.scene.add(sky);

    // a few clouds (flattened spheres)
    for (let i = 0; i < 6; i++) {
      const cloud = new THREE.Mesh(new THREE.SphereGeometry(4 + Math.random() * 3, 8, 8), new THREE.MeshBasicMaterial({ color: 0x2a3a5a, transparent: true, opacity: 0.5 }));
      cloud.scale.y = 0.3;
      cloud.position.set((Math.random() - 0.5) * 100, 30 + Math.random() * 10, (Math.random() - 0.5) * 100);
      this.scene.add(cloud);
    }
  },

  _makeFigure(color) {
    const group = new THREE.Group();
    const bodyMat = new THREE.MeshStandardMaterial({ color });
    const skinMat = new THREE.MeshStandardMaterial({ color: 0xd8a878 });

    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.4, 1.1, 10), bodyMat);
    body.position.y = 1.0;
    body.castShadow = true;
    group.add(body);

    const legs = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.28, 0.9, 10), new THREE.MeshStandardMaterial({ color: 0xffffff }));
    legs.position.y = 0.4;
    group.add(legs);

    const head = new THREE.Mesh(new THREE.SphereGeometry(0.28, 12, 12), skinMat);
    head.position.y = 1.75;
    head.castShadow = true;
    group.add(head);

    const helmet = new THREE.Mesh(new THREE.SphereGeometry(0.3, 12, 12, 0, Math.PI * 2, 0, Math.PI / 1.7), bodyMat);
    helmet.position.y = 1.8;
    group.add(helmet);

    const bat = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.9, 0.05), new THREE.MeshStandardMaterial({ color: 0xdeb887 }));
    bat.position.set(0.45, 0.9, 0.1);
    bat.rotation.z = 0.3;
    group.add(bat);
    group.userData.bat = bat;

    return group;
  },

  _buildFigures() {
    this.bowlerFig = this._makeFigure(0x333366);
    this.bowlerFig.position.set(0, 0, -12);
    this.scene.add(this.bowlerFig);

    this.batsmanFig = this._makeFigure(0x1560BD);
    this.batsmanFig.position.set(-0.6, 0, 9.2);
    this.scene.add(this.batsmanFig);
  },

  setTeamColors(battingColorHex, bowlingColorHex) {
    const bc = new THREE.Color(battingColorHex);
    const wc = new THREE.Color(bowlingColorHex);
    this.batsmanFig.children.forEach(c => { if (c.material && c.geometry.type === 'CylinderGeometry' && c.position.y > 0.6) c.material.color = bc; });
    this.bowlerFig.children.forEach(c => { if (c.material && c.geometry.type === 'CylinderGeometry' && c.position.y > 0.6) c.material.color = wc; });
  },

  _buildBall() {
    const ball = new THREE.Mesh(new THREE.SphereGeometry(0.12, 12, 12), new THREE.MeshStandardMaterial({ color: 0xaa1111 }));
    ball.castShadow = true;
    ball.position.set(0, 1.8, -11.5);
    return ball;
  },

  // Animate ball from bowler to bat over `duration` seconds along a slight arc/swing.
  bowlBall(duration, swingAmount, bounceZ, onBounce) {
    const start = performance.now();
    const startPos = new THREE.Vector3(0, 2.0, -11.5);
    const bouncePos = new THREE.Vector3(swingAmount * 0.3, 0.11, bounceZ);
    const endPos = new THREE.Vector3(swingAmount, 0.9, 9.0);
    let bounced = false;
    this._ballAnim = { start, duration: duration * 1000, startPos, bouncePos, endPos, bounced, onBounce };
  },

  _updateBallAnim() {
    if (!this._ballAnim) return null;
    const a = this._ballAnim;
    const t = Math.min(1, (performance.now() - a.start) / a.duration);
    let pos;
    if (t < 0.55) {
      const lt = t / 0.55;
      pos = a.startPos.clone().lerp(a.bouncePos, lt);
      pos.y = a.startPos.y * (1 - lt) + 0.12 * lt + Math.sin(lt * Math.PI) * 0.4;
    } else {
      if (!a.bounced) { a.bounced = true; if (a.onBounce) a.onBounce(); }
      const lt = (t - 0.55) / 0.45;
      pos = a.bouncePos.clone().lerp(a.endPos, lt);
      pos.y = a.bouncePos.y + Math.sin(lt * Math.PI) * 0.25 * (1 - lt * 0.5);
    }
    this.ball.position.copy(pos);
    if (t >= 1) { const finished = true; this._ballAnim = null; return finished; }
    return false;
  },

  // send ball flying after a hit, toward angle (radians, 0 = straight down ground) and power (0-1)
  hitBall(angleRad, power, lofted) {
    const start = this.ball.position.clone();
    const dist = 10 + power * 32;
    const dir = new THREE.Vector3(Math.sin(angleRad), 0, Math.cos(angleRad));
    const end = start.clone().add(dir.multiplyScalar(dist));
    const peak = lofted ? 6 + power * 10 : 1.2;
    const s = performance.now();
    const dur = 900 + power * 500;
    this._hitAnim = { s, dur, start, end, peak };
  },

  _updateHitAnim() {
    if (!this._hitAnim) return;
    const a = this._hitAnim;
    const t = Math.min(1, (performance.now() - a.s) / a.dur);
    const pos = a.start.clone().lerp(a.end, t);
    pos.y = a.start.y + Math.sin(t * Math.PI) * a.peak;
    this.ball.position.copy(pos);
    if (t >= 1) this._hitAnim = null;
  },

  resetBallToBowler() {
    this.ball.position.set(0, 2.0, -11.5);
    this._ballAnim = null;
    this._hitAnim = null;
  },

  setCamera(mode) {
    this.cameraMode = mode;
  },

  _updateCamera() {
    const target = new THREE.Vector3(0, 1, 0);
    switch (this.cameraMode) {
      case 'bowler':
        this.camera.position.lerp(new THREE.Vector3(0, 3.2, -16), 0.08);
        target.set(0, 1.2, 9);
        break;
      case 'batter':
        this.camera.position.lerp(new THREE.Vector3(1.6, 2.4, 12.5), 0.08);
        target.set(0, 1.4, -10);
        break;
      case 'ball':
        this.camera.position.lerp(new THREE.Vector3(this.ball.position.x + 3, this.ball.position.y + 2, this.ball.position.z + 4), 0.15);
        target.copy(this.ball.position);
        break;
      case 'wide':
      default:
        this.camera.position.lerp(new THREE.Vector3(20, 14, 20), 0.06);
        target.set(0, 1, 0);
    }
    this.camera.lookAt(target);
  },

  _animate() {
    if (this._stopped) return;
    requestAnimationFrame(() => this._animate());
    this._updateBallAnim();
    this._updateHitAnim();
    this._updateCamera();
    this.renderer.render(this.scene, this.camera);
  },

  stop() { this._stopped = true; }
 };
}
