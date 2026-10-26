import * as THREE from 'three';

const mat = (color, roughness = 0.8) => new THREE.MeshStandardMaterial({ color, roughness });
const wood = mat('#9a5e37'); const darkWood = mat('#68402c'); const cream = mat('#fff0d1');
const cookieMat = mat('#c9823d'); const cookieChipMat = mat('#4e2922');
const boxGeometries = new Map();
const CUSTOMER_POOL_SIZE = 8;
const CUSTOMER_QUEUE_LIMIT = 5;
const customerBodyGeometry = new THREE.CapsuleGeometry(.2, .38, 3, 7);
const customerHeadGeometry = new THREE.SphereGeometry(.22, 10, 8);
const customerEyeGeometry = new THREE.SphereGeometry(.018, 5, 4);
const customerLegGeometry = new THREE.CylinderGeometry(.09, .11, .43, 7);
const customerHatGeometry = new THREE.CylinderGeometry(.25, .29, .12, 8);
const customerTreatGeometry = new THREE.SphereGeometry(.11, 8, 6);
const customerShirts = ['#74a7a0', '#d68168', '#8996c7', '#c89253', '#789b72', '#ba7b9c'].map(color => mat(color));
const customerSkins = ['#e5b88e', '#ca916f', '#b77b5e'].map(color => mat(color));
const customerHatMaterials = ['#e5c36c', '#f5eee0', '#9f6eaa', '#d98964'].map(color => mat(color));
const customerEyeMaterial = mat('#3e3532');
function box(w, h, d, material, x = 0, y = 0, z = 0, parent) {
  const key = `${w}:${h}:${d}`;
  if (!boxGeometries.has(key)) boxGeometries.set(key, new THREE.BoxGeometry(w, h, d));
  const mesh = new THREE.Mesh(boxGeometries.get(key), material);
  mesh.position.set(x, y, z); mesh.castShadow = true; mesh.receiveShadow = true;
  (parent || this).add(mesh); return mesh;
}
function cylinder(rt, rb, h, material, x, y, z, parent, seg = 24) {
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), material);
  mesh.position.set(x, y, z); mesh.castShadow = true; mesh.receiveShadow = true; parent.add(mesh); return mesh;
}
function cookie(parent, x, y, z, size = 0.19) {
  const c = cylinder(size, size, 0.065, cookieMat, x, y, z, parent, 18);
  for (const [dx, dz] of [[-.05, -.035], [.055, -.02], [.01, .05]]) {
    const dot = new THREE.Mesh(new THREE.SphereGeometry(size * .1, 7, 6), cookieChipMat);
    dot.position.set(x + dx, y + .041, z + dz); parent.add(dot);
  }
  c.rotation.y = Math.random() * 0.5; return c;
}
function lamp(parent, x, y, z, color = '#ffe0a0') {
  const light = new THREE.PointLight(color, 15, 9); light.position.set(x, y, z); parent.add(light);
  const shade = new THREE.Mesh(new THREE.ConeGeometry(.36, .28, 12), mat('#fff1d0'));
  shade.position.set(x, y - .12, z); shade.rotation.x = Math.PI; parent.add(shade);
}
function tree(parent, x, z) {
  cylinder(.12, .18, .55, mat('#7a4c32'), x, .28, z, parent, 10);
  const leaves = new THREE.Mesh(new THREE.SphereGeometry(.42, 12, 9), mat('#74a66a'));
  leaves.position.set(x, .82, z); leaves.scale.y = 1.1; leaves.castShadow = true; parent.add(leaves);
}

export class BakeryWorld {
  constructor(container, onClick) {
    this.container = container; this.onClick = onClick; this.clickTargets = [];
    this.paused = false; this.customerFlow = null;
    const width = container.clientWidth || innerWidth; const height = container.clientHeight || innerHeight;
    this.scene = new THREE.Scene(); this.scene.background = new THREE.Color('#dce9e7');
    this.aspect = width / height;
    this.camera = new THREE.OrthographicCamera(-8, 8, 7, -7, .1, 100);
    this.cameraTarget = new THREE.Vector3(0, 1, 0);
    this.cameraYaw = this.targetYaw = .65; this.cameraPitch = this.targetPitch = .61;
    this.cameraZoom = this.targetZoom = 1;
    this.cameraDistance = 26;
    this.updateCameraFrustum(width, height); this.positionCamera();
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'low-power' });
    this.renderer.setSize(width, height); this.renderer.setPixelRatio(Math.min(devicePixelRatio, 1.25));
    this.renderer.shadowMap.enabled = width > 620; this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace; this.renderer.toneMapping = THREE.ACESFilmicToneMapping; this.renderer.toneMappingExposure = 1.1;
    container.appendChild(this.renderer.domElement);
    this.root = new THREE.Group(); this.scene.add(this.root);
    this.ambient = new THREE.HemisphereLight('#fff1d5', '#85674c', 2.35); this.scene.add(this.ambient);
    const sun = new THREE.DirectionalLight('#fff6e8', 3.15); sun.position.set(-5, 12, 7); sun.castShadow = width > 620;
    sun.shadow.mapSize.set(768, 768); sun.shadow.camera.left = -10; sun.shadow.camera.right = 10; sun.shadow.camera.top = 10; sun.shadow.camera.bottom = -10; this.sun = sun; this.scene.add(sun);
    this.buildShop(); this.buildCustomers(); this.buildBakingEffects(); this.bindControls(); this.setCameraLocked(false);
    this.resize = new ResizeObserver(() => this.onResize()); this.resize.observe(container);
    this.animate = this.animate.bind(this); this.frame = requestAnimationFrame(this.animate);
  }
  target(mesh, id) { mesh.userData.interactive = id; this.clickTargets.push(mesh); return mesh; }
  buildShop() {
    const g = this.root;
    const floor = new THREE.Mesh(new THREE.BoxGeometry(12, .2, 9), wood); floor.position.y = -.12; floor.receiveShadow = true; g.add(floor);
    this.buildTiledFloor(g);
    const rug = new THREE.Mesh(new THREE.BoxGeometry(5.5, .055, 3.6), mat('#dfb4a1')); rug.position.set(0, .03, 1.25); g.add(rug);
    // Back and side walls frame the open-front diorama.
    box(12, 4.6, .25, cream, 0, 2.2, -4.55, g);
    box(.25, 4.6, 9, mat('#f6d9b4'), -6.05, 2.2, 0, g);
    for (let i = 0; i < 7; i++) box(1.58, 4.42, .035, i % 2 ? mat('#fff3d8') : mat('#fae9c9'), -4.65 + i * 1.55, 2.2, -4.405, g);
    // Wall accents, framed menu and windows.
    for (const x of [-4.5, 4.6]) {
      box(1.1, 1.35, .08, mat('#a77952'), x, 2.85, -4.31, g);
      box(.94, 1.18, .05, mat('#b9d9d7'), x, 2.85, -4.25, g);
      box(.1, 1.17, .06, mat('#fff5dd'), x, 2.85, -4.2, g); box(.94, .1, .06, mat('#fff5dd'), x, 2.85, -4.2, g);
    }
    box(2.1, 1.38, .12, darkWood, 0, 3.35, -4.25, g); box(1.92, 1.18, .08, mat('#32484c'), 0, 3.35, -4.16, g);
    for (let i = 0; i < 4; i++) box(1.05 + (i % 2) * .3, .055, .025, mat('#f4d59e'), .01, 3.7 - i * .22, -4.1, g);
    // Counter, register and pastries.
    const counter = box(4.2, 1.22, 1.25, mat('#be8050'), 0, .69, .05, g); this.target(counter, 'counter');
    box(4.35, .15, 1.38, mat('#f4dfb8'), 0, 1.35, .05, g);
    box(4.12, .12, .1, mat('#d89d6c'), 0, 1.25, .705, g);
    for (const x of [-1.45, 0, 1.45]) {
      box(1.15, .67, .035, mat('#d89d6c'), x, .68, .69, g);
      box(.9, .47, .045, mat('#f1d6af'), x, .68, .718, g);
      box(.12, .06, .045, darkWood, x, .82, .75, g);
    }
    // Small striped awning gives the service counter a bakery storefront feel.
    for (let i = 0; i < 7; i++) {
      const stripe = box(.58, .2, .12, mat(i % 2 ? '#fff0d1' : '#d9825e'), -1.74 + i * .58, 1.54, .2, g);
      stripe.rotation.x = -.18;
    }
    box(.48, .26, .42, darkWood, 1.25, 1.55, -.05, g); box(.38, .1, .32, mat('#d6a96d'), 1.25, 1.73, -.05, g);
    for (let i = 0; i < 5; i++) cookie(g, -1.45 + i * .56, 1.5, .08, .17);
    // Three ovens, glowing doors, stovetop knobs and cookie trays.
    this.ovens = [];
    for (let i = 0; i < 3; i++) {
      const x = -4.25 + i * 1.7;
      const oven = new THREE.Group(); oven.position.set(x, .28, -2.65); g.add(oven);
      box(1.35, 1.5, 1.35, mat('#83a2a0'), 0, .75, 0, oven);
      box(1.05, .84, .08, mat('#405255'), 0, .7, .69, oven);
      box(.85, .53, .03, mat('#f08b46'), 0, .71, .745, oven);
      box(.72, .045, .035, mat('#f7c98d'), 0, .39, .77, oven);
      cylinder(.04, .04, .11, mat('#d5e1dc'), 0, .71, .79, oven, 10).rotation.x = Math.PI / 2;
      box(1.08, .07, .1, mat('#d6dfe0'), 0, 1.23, .68, oven);
      for (let n = 0; n < 3; n++) cylinder(.075, .075, .05, mat('#394142'), -.35 + n * .35, 1.39, .72, oven);
      for (let n = 0; n < 3; n++) cookie(oven, -.28 + n * .28, .48, .79, .13);
      this.target(oven.children[0], 'oven'); this.ovens.push(oven);
    }
    // Shelves and jars.
    const shelf = new THREE.Group(); shelf.position.set(4.55, .2, -2.45); g.add(shelf);
    box(2.2, .12, .68, darkWood, 0, 1.02, 0, shelf); box(2.2, .12, .68, darkWood, 0, 2.0, 0, shelf);
    for (const x of [-.95, .95]) box(.11, 2.15, .55, wood, x, 1.05, 0, shelf);
    for (let i = 0; i < 5; i++) {
      cookie(shelf, -.76 + i * .38, 1.18, .04, .13);
      cylinder(.13, .13, .3, mat(i % 2 ? '#8fb5a5' : '#f0c27b'), -.75 + i * .37, 2.25, -.02, shelf, 14);
    }
    this.target(shelf.children[0], 'shelves');
    // Small dining area.
    const table = new THREE.Group(); table.position.set(2.85, 0, 1.55); g.add(table);
    cylinder(.72, .72, .13, cream, 0, .95, 0, table, 24); cylinder(.1, .14, .92, wood, 0, .48, 0, table);
    for (const [x, z] of [[-.44, -.44], [.44, -.44], [-.44, .44], [.44, .44]]) box(.13, .68, .13, wood, x, .35, z, table);
    for (const [x, z] of [[-1.12, 0], [1.12, 0], [0, -1.12]]) {
      box(.62, .15, .62, mat('#d98c64'), x, .75, z, table);
      for (const lx of [-.22, .22]) for (const lz of [-.22, .22]) box(.08, .68, .08, wood, x + lx, .38, z + lz, table);
    }
    this.target(table.children[0], 'table');
    // Plants, hanging lamps, a potted tree, welcome mat and Kevin.
    for (const [x, z] of [[-5.2, 2.9], [5.2, -3.55]]) tree(g, x, z);
    for (const x of [-2.8, 0, 2.8]) { box(.055, 1.1, .055, darkWood, x, 4.2, -1.5, g); lamp(g, x, 3.68, -1.5); }
    box(2.1, .06, .9, mat('#b9805a'), 0, .02, 4.12, g);
    const door = box(1.12, 2.3, .18, mat('#85a699'), 0, 1.16, -4.26, g); door.position.x = 5.12; this.target(door, 'door');
    this.kevin = new THREE.Group(); this.kevin.position.set(-1.0, 0, 2.0); g.add(this.kevin); this.buildKevin();
    const kevinHit = new THREE.Mesh(new THREE.CapsuleGeometry(.47, .78, 4, 8), new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false }));
    kevinHit.position.y = 1.02; this.kevin.add(this.target(kevinHit, 'kevin'));
    const board = box(.5, .62, .08, darkWood, -4.7, 2.15, -4.22, g); this.target(board, 'board');
    this.setShopStyle('cozy', 'classic', 1);
  }
  buildTiledFloor(parent) {
    const geometry = new THREE.BoxGeometry(.96, .055, .96);
    const palette = [mat('#f1d8b3'), mat('#e8c79e'), mat('#f7e4c7')];
    const transforms = palette.map(() => []);
    const tile = new THREE.Object3D();
    for (let row = 0; row < 9; row++) {
      for (let column = 0; column < 12; column++) {
        const paletteIndex = (row + column) % 2 === 0 ? 0 : ((row * 3 + column) % 11 === 0 ? 2 : 1);
        tile.position.set(-5.5 + column, -.018, -4 + row); tile.updateMatrix();
        transforms[paletteIndex].push(tile.matrix.clone());
      }
    }
    transforms.forEach((matrices, index) => {
      if (!matrices.length) return;
      const tiles = new THREE.InstancedMesh(geometry, palette[index], matrices.length);
      matrices.forEach((matrix, i) => tiles.setMatrixAt(i, matrix));
      tiles.instanceMatrix.needsUpdate = true; tiles.receiveShadow = true; tiles.castShadow = false; parent.add(tiles);
    });
  }
  buildKevin() {
    this.kevin.clear(); const shirt = mat('#e58f56'); const skin = mat('#efbd91');
    const torso = new THREE.Mesh(new THREE.CapsuleGeometry(.3, .52, 4, 8), shirt); torso.position.y = .85; torso.castShadow = true; this.kevin.add(torso);
    cylinder(.16, .18, .12, mat('#384852'), -.12, .37, 0, this.kevin, 12); cylinder(.16, .18, .12, mat('#384852'), .12, .37, 0, this.kevin, 12);
    const head = new THREE.Mesh(new THREE.SphereGeometry(.38, 16, 12), skin); head.position.set(0, 1.55, 0); head.castShadow = true; this.kevin.add(head);
    const hair = new THREE.Mesh(new THREE.SphereGeometry(.4, 14, 10, 0, Math.PI * 2, 0, Math.PI * .53), mat('#634534')); hair.position.set(0, 1.62, 0); this.kevin.add(hair);
    for (const x of [-.13, .13]) { const eye = new THREE.Mesh(new THREE.SphereGeometry(.035, 6, 6), mat('#443833')); eye.position.set(x, 1.57, .34); this.kevin.add(eye); }
    const smile = new THREE.Mesh(new THREE.TorusGeometry(.095, .018, 5, 10, Math.PI), mat('#984e43')); smile.position.set(0, 1.38, .34); this.kevin.add(smile);
    const hat = new THREE.Mesh(new THREE.CylinderGeometry(.35, .29, .15, 12), cream); hat.position.y = 1.95; this.kevin.add(hat);
  }
  buildCustomers() {
    this.customerGroup = new THREE.Group(); this.root.add(this.customerGroup); this.customers = [];
    for (let i = 0; i < CUSTOMER_POOL_SIZE; i++) {
      const person = new THREE.Group();
      const body = new THREE.Mesh(customerBodyGeometry, customerShirts[i % customerShirts.length]);
      body.position.y = .57; body.castShadow = true; person.add(body);
      const head = new THREE.Mesh(customerHeadGeometry, customerSkins[i % customerSkins.length]);
      head.position.y = .99; head.castShadow = true; person.add(head);
      for (const x of [-.08, .08]) {
        const eye = new THREE.Mesh(customerEyeGeometry, customerEyeMaterial);
        eye.position.set(x, 1.02, .19); person.add(eye);
      }
      if (i % 2 === 0) {
        const hat = new THREE.Mesh(customerHatGeometry, customerHatMaterials[(i / 2) % customerHatMaterials.length]);
        hat.position.y = 1.18; person.add(hat);
      }
      const legs = [];
      for (const x of [-.09, .09]) {
        const leg = new THREE.Mesh(customerLegGeometry, mat('#46525a'));
        leg.position.set(x, .22, 0); leg.castShadow = true; person.add(leg); legs.push(leg);
      }
      const treat = new THREE.Mesh(customerTreatGeometry, cookieMat);
      treat.position.set(.25, .78, .12); treat.visible = false; person.add(treat);
      person.userData.treat = treat;
      person.userData.poolId = i; person.userData.legs = legs; person.userData.phase = 'idle';
      person.visible = false; this.customerGroup.add(person); this.customers.push(person);
    }
  }
  buildBakingEffects() {
    const particleGeometry = new THREE.SphereGeometry(.11, 8, 6);
    const particleMaterial = mat('#f5bc63');
    this.bakeParticles = Array.from({ length: 7 }, (_, i) => {
      const particle = new THREE.Mesh(particleGeometry, particleMaterial);
      particle.visible = false; particle.castShadow = false;
      particle.userData.offset = (i - 3) * .23; this.root.add(particle); return particle;
    });
  }
  finishBaking() {
    const now = performance.now();
    this.bakeParticles.forEach((particle, i) => {
      particle.visible = true; particle.userData.start = now;
      particle.userData.originY = 1.35 + (i % 2) * .15;
      particle.position.set(-2.4 + i * .8, particle.userData.originY, .9);
    });
  }
  startCustomers(count, arrivalInterval, onCounter, onComplete) {
    this.clearCustomerFlow();
    const total = THREE.MathUtils.clamp(Math.floor(count), 0, 60);
    this.customerFlow = {
      total, arrived: 0, completed: 0,
      arrivalInterval: THREE.MathUtils.clamp(arrivalInterval, 350, 1200),
      nextArrival: performance.now() + 80, queue: [], inService: null,
      onCounter, onComplete, finishSent: false,
    };
    this.customers.forEach(person => { person.visible = false; person.userData.phase = 'idle'; });
    if (total === 0) this.finishCustomerFlow();
  }
  clearCustomerFlow() {
    this.customerFlow = null;
    this.customers?.forEach(person => { person.visible = false; person.userData.phase = 'idle'; });
  }
  spawnCustomer(now) {
    const flow = this.customerFlow;
    if (!flow || flow.arrived >= flow.total || flow.queue.length >= CUSTOMER_QUEUE_LIMIT) return false;
    const person = this.customers.find(candidate => !candidate.visible);
    if (!person) return false;
    const taskId = `${flow.arrived}:${person.userData.poolId}`;
    person.visible = true; person.position.set(-4.8, 0, 5.25);
    person.userData.taskId = taskId; person.userData.phase = 'walkIn';
    person.userData.routeStage = 0; person.userData.waitStarted = 0;
    person.userData.counterCalled = false; person.userData.walkPhase = now * .01;
    person.userData.treat.visible = false;
    flow.queue.push(person); flow.arrived += 1; flow.nextArrival = now + flow.arrivalInterval;
    return true;
  }
  queuePosition(index) {
    return { x: -2.55 - index * .48, z: 1.22 + index * .16 };
  }
  moveCustomer(person, x, z, speed, delta) {
    const dx = x - person.position.x; const dz = z - person.position.z;
    const distance = Math.hypot(dx, dz);
    if (distance < .065) { person.position.x = x; person.position.z = z; return true; }
    const step = Math.min(distance, speed * delta);
    person.position.x += dx / distance * step; person.position.z += dz / distance * step;
    person.rotation.y = Math.atan2(dx, dz);
    return false;
  }
  beginNextCustomer() {
    const flow = this.customerFlow;
    if (!flow || flow.inService || !flow.queue.length) return;
    const next = flow.queue[0];
    if (next.userData.phase !== 'queue') return;
    const slot = this.queuePosition(0);
    if (Math.hypot(next.position.x - slot.x, next.position.z - slot.z) > .1) return;
    flow.inService = next;
    flow.inService.userData.phase = 'walkToCounter';
  }
  waitForStock(taskId) {
    const person = this.findCustomer(taskId);
    if (!person || person.userData.phase !== 'atCounter') return;
    person.userData.phase = 'waitingStock'; person.userData.waitStarted = performance.now();
  }
  releaseWaitingCustomers() {
    const flow = this.customerFlow;
    if (!flow || !flow.inService || flow.inService.userData.phase !== 'waitingStock') return;
    flow.inService.userData.phase = 'atCounter'; flow.inService.userData.waitStarted = 0;
    flow.onCounter?.(flow.inService.userData.taskId);
  }
  findCustomer(taskId) {
    return this.customers.find(person => person.visible && person.userData.taskId === taskId);
  }
  completeCustomer(taskId, cookiesBought = 0) {
    const flow = this.customerFlow; const person = this.findCustomer(taskId);
    if (!flow || !person || !['atCounter', 'waitingStock'].includes(person.userData.phase)) return false;
    flow.queue = flow.queue.filter(customer => customer !== person);
    if (flow.inService === person) flow.inService = null;
    person.userData.phase = 'leaving'; person.userData.routeStage = 0;
    person.userData.treat.visible = cookiesBought > 0; flow.completed += 1;
    this.repositionQueue(); this.beginNextCustomer();
    return true;
  }
  repositionQueue() {
    const flow = this.customerFlow; if (!flow) return;
    flow.queue.forEach((person, index) => { person.userData.queueIndex = index; });
  }
  updateCustomerFlow(now, delta) {
    const flow = this.customerFlow;
    if (!flow || this.paused) return;
    if (flow.arrived < flow.total && now >= flow.nextArrival && flow.queue.length < CUSTOMER_QUEUE_LIMIT) this.spawnCustomer(now);
    this.beginNextCustomer();
    for (const person of this.customers) {
      if (!person.visible) continue;
      const user = person.userData; const phase = user.phase;
      const walk = ['walkIn', 'queue', 'walkToCounter', 'leaving'].includes(phase);
      const bob = Math.sin(now * .008 + user.walkPhase) * (walk ? .045 : .018);
      person.position.y = Math.max(0, bob);
      user.legs?.forEach((leg, i) => { leg.rotation.x = walk ? Math.sin(now * .012 + user.walkPhase + i * Math.PI) * .28 : 0; });
      if (phase === 'walkIn') {
        if (this.moveCustomer(person, -4.55, 2.9, 2.5, delta)) user.phase = 'queue';
      } else if (phase === 'queue') {
        const slot = this.queuePosition(user.queueIndex ?? 0);
        this.moveCustomer(person, slot.x, slot.z, 2.6, delta);
      } else if (phase === 'walkToCounter') {
        if (this.moveCustomer(person, -1.45, 1.08, 2.7, delta)) {
          user.phase = 'atCounter'; user.counterCalled = true;
          flow.onCounter?.(user.taskId);
        }
      } else if (phase === 'waitingStock') {
        if (now - user.waitStarted > 7000) this.completeCustomer(user.taskId);
      } else if (phase === 'leaving') {
        const exit = user.routeStage === 0 ? [-4.55, 2.9] : [-4.8, 5.4];
        if (this.moveCustomer(person, exit[0], exit[1], 3, delta)) {
          if (user.routeStage === 0) user.routeStage = 1;
          else { person.visible = false; user.phase = 'idle'; user.treat.visible = false; }
        }
      }
    }
    this.repositionQueue();
    this.beginNextCustomer();
    if (flow.arrived >= flow.total && flow.completed >= flow.total && this.customers.every(person => !person.visible)) this.finishCustomerFlow();
  }
  finishCustomerFlow() {
    const flow = this.customerFlow;
    if (!flow || flow.finishSent) return;
    flow.finishSent = true; flow.onComplete?.();
  }
  getCustomerMetrics() {
    const flow = this.customerFlow;
    if (!flow) return { arrived: 0, total: 0, active: 0, queue: 0, served: 0 };
    return {
      arrived: flow.arrived, total: flow.total,
      active: this.customers.filter(person => person.visible).length,
      queue: flow.queue.length, served: flow.completed,
    };
  }
  setPaused(paused) {
    const next = Boolean(paused);
    if (next === this.paused) return;
    if (next) { this.paused = true; this.pauseStarted = performance.now(); return; }
    const elapsed = performance.now() - (this.pauseStarted || performance.now());
    if (this.customerFlow) this.customerFlow.nextArrival += elapsed;
    this.customers.forEach(person => {
      if (person.userData.waitStarted) person.userData.waitStarted += elapsed;
    });
    this.paused = false;
  }
  setShopStyle(decor, outfit, level) {
    const palettes = { cozy: ['#dce9e7', '#fff0d1'], mint: ['#d4e8df', '#d9eee4'], pink: ['#f1d5dc', '#f4e3db'], midnight: ['#cfd5e3', '#e2e0ed'] };
    this.scene.background.set(palettes[decor]?.[0] || palettes.cozy[0]);
    const shirt = { classic: '#e58f56', mint: '#58a892', berry: '#b76074', star: '#5966ae' }[outfit] || '#e58f56';
    this.kevin.children[0]?.material.color.set(shirt);
    this.kevin.scale.setScalar(1 + Math.min(.08, (level - 1) * .008));
  }
  bindControls() {
    this.raycaster = new THREE.Raycaster(); this.pointer = new THREE.Vector2(); this.drag = null;
    const el = this.renderer.domElement;
    el.addEventListener('pointerdown', (e) => { this.drag = { x: e.clientX, y: e.clientY, moved: false }; el.setPointerCapture(e.pointerId); });
    el.addEventListener('pointermove', (e) => {
      if (!this.drag) {
        const rect = el.getBoundingClientRect(); this.pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        this.pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
        this.raycaster.setFromCamera(this.pointer, this.camera);
        el.style.cursor = this.raycaster.intersectObjects(this.clickTargets, true).some(hit => hit.object.userData.interactive) ? 'pointer' : 'grab';
        return;
      }
      if (this.locked) return;
      const dx = e.clientX - this.drag.x; const dy = e.clientY - this.drag.y;
      if (Math.abs(dx) + Math.abs(dy) > 2) this.drag.moved = true;
      this.targetYaw = THREE.MathUtils.clamp(this.targetYaw + dx * .004, -.45, 1.75);
      this.targetPitch = THREE.MathUtils.clamp(this.targetPitch - dy * .0025, .48, .78);
      this.drag.x = e.clientX; this.drag.y = e.clientY;
    });
    el.addEventListener('pointerup', (e) => {
      if (this.drag && !this.drag.moved) {
        const rect = el.getBoundingClientRect(); this.pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        this.pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
        this.raycaster.setFromCamera(this.pointer, this.camera);
        const found = this.raycaster.intersectObjects(this.clickTargets, true).find(hit => hit.object.userData.interactive);
        if (found) this.onClick(found.object.userData.interactive);
      }
      this.drag = null;
    });
    el.addEventListener('wheel', (e) => { e.preventDefault(); this.zoom(e.deltaY > 0 ? 1 : -1); }, { passive: false });
  }
  updateCameraFrustum(width, height) {
    this.aspect = width / height;
    const verticalSpan = Math.max(12.5, 16 / this.aspect);
    this.camera.left = -verticalSpan * this.aspect / 2; this.camera.right = verticalSpan * this.aspect / 2;
    this.camera.top = verticalSpan / 2; this.camera.bottom = -verticalSpan / 2;
    this.camera.updateProjectionMatrix();
  }
  positionCamera() {
    const horizontal = this.cameraDistance * Math.cos(this.cameraPitch);
    this.camera.position.set(
      this.cameraTarget.x + horizontal * Math.sin(this.cameraYaw),
      this.cameraTarget.y + this.cameraDistance * Math.sin(this.cameraPitch),
      this.cameraTarget.z + horizontal * Math.cos(this.cameraYaw),
    );
    this.camera.lookAt(this.cameraTarget);
  }
  zoom(direction) { this.targetZoom = THREE.MathUtils.clamp(this.targetZoom - direction * .12, .72, 1.55); }
  rotate(direction) { if (!this.locked) this.targetYaw = THREE.MathUtils.clamp(this.targetYaw + direction * .16, -.45, 1.75); }
  setCameraLocked(locked) { this.locked = Boolean(locked); }
  onResize() {
    const w = this.container.clientWidth; const h = this.container.clientHeight; if (!w || !h) return;
    this.updateCameraFrustum(w, h); this.renderer.setSize(w, h);
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, 1.25));
    this.renderer.shadowMap.enabled = w > 620; this.sun.castShadow = w > 620;
  }
  animate(now) {
    this.frame = requestAnimationFrame(this.animate);
    const delta = this.lastFrame ? THREE.MathUtils.clamp((now - this.lastFrame) / 1000, 0, .05) : 1 / 60;
    this.lastFrame = now;
    this.cameraYaw += (this.targetYaw - this.cameraYaw) * .12;
    this.cameraPitch += (this.targetPitch - this.cameraPitch) * .12;
    this.cameraZoom += (this.targetZoom - this.cameraZoom) * .16;
    if (Math.abs(this.camera.zoom - this.cameraZoom) > .001) {
      this.camera.zoom = this.cameraZoom; this.camera.updateProjectionMatrix();
    }
    this.positionCamera();
    this.updateCustomerFlow(now, delta);
    for (const particle of this.bakeParticles) {
      if (!particle.visible) continue;
      const progress = (now - particle.userData.start) / 850;
      if (progress >= 1) { particle.visible = false; continue; }
      particle.position.y = particle.userData.originY + Math.sin(progress * Math.PI) * 1.15;
      particle.position.x += particle.userData.offset * delta * .12;
      const scale = 1 - progress * .3; particle.scale.setScalar(scale);
    }
    this.kevin.rotation.y = Math.sin(now * .0007) * .08;
    this.renderer.render(this.scene, this.camera);
  }
  dispose() {
    cancelAnimationFrame(this.frame); this.resize.disconnect(); this.clearCustomerFlow();
    const geometries = new Set(); const materials = new Set();
    this.scene.traverse(object => {
      if (object.geometry) geometries.add(object.geometry);
      if (Array.isArray(object.material)) object.material.forEach(material => materials.add(material));
      else if (object.material) materials.add(object.material);
    });
    geometries.forEach(geometry => geometry.dispose()); materials.forEach(material => material.dispose());
    this.renderer.dispose(); this.renderer.domElement.remove();
  }
}
