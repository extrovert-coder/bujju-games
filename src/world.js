import * as THREE from 'three';
import { RECIPES } from './content.js';

const mat = (color, roughness = 0.78, metalness = 0.05) =>
  new THREE.MeshStandardMaterial({ color, roughness, metalness });

const wood = mat('#9a5e37');
const darkWood = mat('#68402c');
const cream = mat('#fff0d1');
const goldMat = mat('#e8ba4f', 0.4, 0.4);

// Reused shared geometries for maximum performance on integrated graphics
const boxGeometries = new Map();
const customerBodyGeometry = new THREE.CapsuleGeometry(0.24, 0.34, 4, 8);
const customerHeadGeometry = new THREE.SphereGeometry(0.26, 12, 10);
const customerCheekGeometry = new THREE.SphereGeometry(0.045, 6, 6);
const customerEyeGeometry = new THREE.SphereGeometry(0.026, 6, 5);
const customerPupilHighlightGeometry = new THREE.SphereGeometry(0.01, 4, 4);
const customerMouthGeometry = new THREE.TorusGeometry(0.055, 0.014, 5, 8, Math.PI);
const customerArmGeometry = new THREE.CylinderGeometry(0.065, 0.075, 0.28, 7);
const customerHandGeometry = new THREE.SphereGeometry(0.07, 7, 6);
const customerLegGeometry = new THREE.CylinderGeometry(0.08, 0.095, 0.38, 7);
const customerShoeGeometry = new THREE.BoxGeometry(0.16, 0.09, 0.24);
const customerTreatGeometry = new THREE.CylinderGeometry(0.12, 0.12, 0.05, 12);
const treatBoxGeometry = new THREE.BoxGeometry(0.28, 0.2, 0.28);
const steamParticleGeometry = new THREE.SphereGeometry(0.07, 6, 5);
const heartParticleGeometry = new THREE.SphereGeometry(0.09, 7, 6);
const transferCookieGeometry = new THREE.CylinderGeometry(0.14, 0.14, 0.045, 12);

// Shared materials
const cheekMaterial = mat('#f08b98', 0.9);
const eyeWhiteMaterial = mat('#2b221f');
const eyeHighlightMaterial = new THREE.MeshBasicMaterial({ color: '#ffffff' });
const mouthMaterial = mat('#8c3e38');
const steamMaterial = new THREE.MeshBasicMaterial({ color: '#fff9ed', transparent: true, opacity: 0.55 });
const heartMaterial = new THREE.MeshStandardMaterial({ color: '#f06292', roughness: 0.3, emissive: '#c2185b', emissiveIntensity: 0.4 });
const starMaterial = new THREE.MeshStandardMaterial({ color: '#ffd54f', roughness: 0.2, emissive: '#ffb300', emissiveIntensity: 0.5 });
const treatBoxMaterial = mat('#f6d2b8');
const treatRibbonMaterial = mat('#df6f56');

// Procedural customer styling configurations
const CUSTOMER_STYLES = [
  { shirt: '#e57864', pants: '#3b4954', skin: '#efbd91', hair: '#503223', hairType: 'bob', hat: null, accessory: 'ribbon' },
  { shirt: '#58a08f', pants: '#43434f', skin: '#d69772', hair: '#35241b', hairType: 'bun', hat: null, accessory: 'glasses' },
  { shirt: '#e5b058', pants: '#394c5e', skin: '#f0cb9e', hair: '#694532', hairType: 'curls', hat: null, accessory: 'scarf' },
  { shirt: '#8e76a8', pants: '#2d3b45', skin: '#b98061', hair: '#38251a', hairType: 'short', hat: 'beret', accessory: null },
  { shirt: '#4d84a8', pants: '#544840', skin: '#e8ba90', hair: '#4a3020', hairType: 'sidePart', hat: null, accessory: 'glasses' },
  { shirt: '#c46f8c', pants: '#3d4952', skin: '#c78a68', hair: '#2e1f18', hairType: 'pigtails', hat: null, accessory: 'bow' },
  { shirt: '#729c66', pants: '#44464d', skin: '#f4d1a6', hair: '#804d33', hairType: 'wavy', hat: 'beanie', accessory: null },
  { shirt: '#df8c52', pants: '#2f3d47', skin: '#a86c4e', hair: '#1f1a18', hairType: 'crop', hat: null, accessory: 'scarf' },
  { shirt: '#d16b60', pants: '#3a4650', skin: '#edbe96', hair: '#442d20', hairType: 'puff', hat: 'visor', accessory: null },
  { shirt: '#638aa0', pants: '#48443e', skin: '#cf9370', hair: '#5a3a2a', hairType: 'sweep', hat: null, accessory: 'glasses' },
];

function box(w, h, d, material, x = 0, y = 0, z = 0, parent) {
  const key = `${w}:${h}:${d}`;
  if (!boxGeometries.has(key)) boxGeometries.set(key, new THREE.BoxGeometry(w, h, d));
  const mesh = new THREE.Mesh(boxGeometries.get(key), material);
  mesh.position.set(x, y, z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  if (parent) parent.add(mesh);
  return mesh;
}

function cylinder(rt, rb, h, material, x, y, z, parent, seg = 16) {
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), material);
  mesh.position.set(x, y, z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  if (parent) parent.add(mesh);
  return mesh;
}

function cookie(parent, x, y, z, recipeId = 'classic', size = 0.17) {
  const recipe = RECIPES.find(r => r.id === recipeId) || RECIPES[0];
  const cMat = mat(recipe.color || '#c9823d', recipe.isGolden ? 0.35 : 0.8, recipe.isGolden ? 0.35 : 0.05);
  const chipMat = mat(recipe.chipColor || '#4e2922', 0.6);
  const c = cylinder(size, size, 0.055, cMat, x, y, z, parent, 14);

  const dots = [[-0.045, -0.03], [0.05, -0.015], [0.01, 0.045], [-0.02, 0.025]];
  dots.forEach(([dx, dz], i) => {
    let dotColorMat = chipMat;
    if (recipe.hasSprinkles) {
      const sprinklePalette = ['#e54860', '#3b9fe0', '#56c268', '#f2d138'];
      dotColorMat = mat(sprinklePalette[i % sprinklePalette.length]);
    }
    const dot = new THREE.Mesh(new THREE.SphereGeometry(size * 0.11, 6, 5), dotColorMat);
    dot.position.set(x + dx, y + 0.035, z + dz);
    parent.add(dot);
  });
  c.rotation.y = Math.random() * Math.PI;
  return c;
}

function lamp(parent, x, y, z, color = '#ffe4b5') {
  const light = new THREE.PointLight(color, 16, 9);
  light.position.set(x, y, z);
  parent.add(light);
  const shade = new THREE.Mesh(new THREE.ConeGeometry(0.38, 0.28, 12), mat('#fff4d6'));
  shade.position.set(x, y - 0.12, z);
  shade.rotation.x = Math.PI;
  parent.add(shade);
}

function plant(parent, x, y, z) {
  cylinder(0.16, 0.12, 0.28, mat('#d88960'), x, y + 0.14, z, parent, 10);
  const foliage = new THREE.Mesh(new THREE.SphereGeometry(0.24, 10, 8), mat('#689e60'));
  foliage.position.set(x, y + 0.36, z);
  foliage.scale.set(1.1, 0.9, 1.1);
  parent.add(foliage);
  const flower = new THREE.Mesh(new THREE.SphereGeometry(0.06, 6, 5), mat('#f06e86'));
  flower.position.set(x, y + 0.54, z);
  parent.add(flower);
}

export class BakeryWorld {
  constructor(container, onClick) {
    this.container = container;
    this.onClick = onClick;
    this.clickTargets = [];
    this.paused = false;
    this.customerFlow = null;
    this.bakingProgress = 0;
    this.bakingReady = false;

    const width = container.clientWidth || innerWidth;
    const height = container.clientHeight || innerHeight;

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color('#dce9e7');
    this.aspect = width / height;

    this.camera = new THREE.OrthographicCamera(-8, 8, 7, -7, 0.1, 100);
    this.cameraTarget = new THREE.Vector3(0, 1.1, 0);
    this.cameraYaw = this.targetYaw = 0.65;
    this.cameraPitch = this.targetPitch = 0.61;
    this.cameraZoom = this.targetZoom = 1;
    this.cameraDistance = 26;

    this.updateCameraFrustum(width, height);
    this.positionCamera();

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'low-power' });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, 1.25));
    this.renderer.shadowMap.enabled = width > 620;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.12;
    container.appendChild(this.renderer.domElement);

    this.root = new THREE.Group();
    this.scene.add(this.root);

    this.ambient = new THREE.HemisphereLight('#fff5df', '#7f634b', 2.4);
    this.scene.add(this.ambient);

    const sun = new THREE.DirectionalLight('#fff8ea', 3.2);
    sun.position.set(-6, 13, 8);
    sun.castShadow = width > 620;
    sun.shadow.mapSize.set(768, 768);
    sun.shadow.camera.left = -10;
    sun.shadow.camera.right = 10;
    sun.shadow.camera.top = 10;
    sun.shadow.camera.bottom = -10;
    this.sun = sun;
    this.scene.add(sun);

    this.buildShop();
    this.buildCustomers();
    this.buildBakingEffects();
    this.buildTransferEffects();
    this.bindControls();
    this.setCameraLocked(false);

    this.resize = new ResizeObserver(() => this.onResize());
    this.resize.observe(container);

    this.animate = this.animate.bind(this);
    this.frame = requestAnimationFrame(this.animate);
  }

  target(mesh, id) {
    mesh.userData.interactive = id;
    this.clickTargets.push(mesh);
    return mesh;
  }

  buildShop() {
    const g = this.root;

    // Floor and warm diorama walls
    const floor = new THREE.Mesh(new THREE.BoxGeometry(12, 0.2, 9), wood);
    floor.position.y = -0.12;
    floor.receiveShadow = true;
    g.add(floor);
    this.buildTiledFloor(g);

    // Cozy bakery rug
    const rug = new THREE.Mesh(new THREE.BoxGeometry(5.6, 0.055, 3.8), mat('#dfb4a1'));
    rug.position.set(0, 0.03, 1.25);
    g.add(rug);

    // Walls
    box(12, 4.6, 0.25, cream, 0, 2.2, -4.55, g);
    box(0.25, 4.6, 9, mat('#f6d9b4'), -6.05, 2.2, 0, g);
    for (let i = 0; i < 7; i++) {
      box(1.58, 4.42, 0.035, i % 2 ? mat('#fff3d8') : mat('#fae9c9'), -4.65 + i * 1.55, 2.2, -4.405, g);
    }

    // Windows with sky tint
    for (const x of [-4.5, 4.6]) {
      box(1.15, 1.4, 0.08, mat('#a77952'), x, 2.85, -4.31, g);
      box(0.98, 1.22, 0.05, mat('#bfe0de'), x, 2.85, -4.25, g);
      box(0.1, 1.2, 0.06, mat('#fff7e3'), x, 2.85, -4.2, g);
      box(0.98, 0.1, 0.06, mat('#fff7e3'), x, 2.85, -4.2, g);
    }

    // Chalkboard menu
    box(2.2, 1.45, 0.12, darkWood, 0, 3.35, -4.25, g);
    box(2.0, 1.25, 0.08, mat('#2d3f42'), 0, 3.35, -4.16, g);
    // Menu chalk lines with cookie chalk doodles
    for (let i = 0; i < 4; i++) {
      box(1.1 + (i % 2) * 0.35, 0.05, 0.025, mat('#f8deac'), 0.01, 3.7 - i * 0.22, -4.1, g);
    }
    const menuBadge = cylinder(0.14, 0.14, 0.04, mat('#e58a50'), -0.65, 3.7, -4.09, g, 10);
    menuBadge.rotation.x = Math.PI / 2;

    // Service counter
    const counter = box(4.4, 1.25, 1.35, mat('#be8050'), 0, 0.69, 0.05, g);
    this.target(counter, 'counter');
    box(4.55, 0.16, 1.48, mat('#f5e2bf'), 0, 1.36, 0.05, g);
    box(4.2, 0.12, 0.1, mat('#d89d6c'), 0, 1.25, 0.755, g);

    // Front counter front panels with wood inlay
    for (const x of [-1.45, 0, 1.45]) {
      box(1.18, 0.7, 0.035, mat('#d89d6c'), x, 0.68, 0.74, g);
      box(0.92, 0.5, 0.045, mat('#f2d9b4'), x, 0.68, 0.765, g);
      box(0.12, 0.06, 0.045, darkWood, x, 0.82, 0.79, g);
    }

    // Striped counter awning
    for (let i = 0; i < 7; i++) {
      const stripe = box(0.62, 0.2, 0.14, mat(i % 2 ? '#fff0d1' : '#d9825e'), -1.86 + i * 0.62, 1.55, 0.24, g);
      stripe.rotation.x = -0.18;
    }

    // Register and bell
    box(0.5, 0.28, 0.44, darkWood, 1.35, 1.56, -0.05, g);
    box(0.4, 0.12, 0.34, mat('#d6a96d'), 1.35, 1.74, -0.05, g);
    cylinder(0.06, 0.08, 0.06, goldMat, 0.95, 1.48, 0.25, g, 10);

    // Glass pastry display showcase on the counter
    const glassMat = new THREE.MeshStandardMaterial({
      color: '#e4f3f2',
      roughness: 0.1,
      metalness: 0.1,
      transparent: true,
      opacity: 0.38,
    });
    const showcase = box(2.2, 0.65, 0.85, glassMat, -0.65, 1.76, 0.05, g);
    box(2.24, 0.05, 0.88, goldMat, -0.65, 1.44, 0.05, g);
    box(2.24, 0.05, 0.88, goldMat, -0.65, 2.08, 0.05, g);

    // Tiered trays inside showcase displaying recipe varieties
    this.counterTrays = new THREE.Group();
    g.add(this.counterTrays);
    this.refreshCounterDisplays(['classic', 'chip', 'berry', 'choco']);

    // Ovens
    this.ovens = [];
    this.ovenWindows = [];
    this.ovenLights = [];
    this.ovenBakingCookies = [];

    for (let i = 0; i < 3; i++) {
      const x = -4.25 + i * 1.7;
      const oven = new THREE.Group();
      oven.position.set(x, 0.28, -2.65);
      g.add(oven);

      // Main body
      box(1.38, 1.55, 1.38, mat('#7b9a98'), 0, 0.77, 0, oven);
      // Oven door frame
      box(1.08, 0.88, 0.08, mat('#3c4d50'), 0, 0.72, 0.7, oven);

      // Glowing oven glass window
      const windowMat = new THREE.MeshStandardMaterial({
        color: '#ff8a3d',
        roughness: 0.2,
        emissive: '#ff7722',
        emissiveIntensity: 0.3,
      });
      const windowMesh = box(0.86, 0.54, 0.03, windowMat, 0, 0.73, 0.75, oven);
      this.ovenWindows.push(windowMesh);

      // Status indicator light above door (turns green when ready!)
      const statusMat = new THREE.MeshStandardMaterial({
        color: '#e58f50',
        emissive: '#e57a30',
        emissiveIntensity: 0.4,
      });
      const statusLight = cylinder(0.045, 0.045, 0.04, statusMat, 0.42, 1.25, 0.73, oven, 10);
      statusLight.rotation.x = Math.PI / 2;
      this.ovenLights.push(statusLight);

      // Metal handle & dials
      box(0.72, 0.045, 0.035, mat('#f7c98d'), 0, 0.41, 0.77, oven);
      for (let n = 0; n < 3; n++) {
        cylinder(0.07, 0.07, 0.05, mat('#394142'), -0.32 + n * 0.32, 1.41, 0.73, oven, 10);
      }

      // Cookies on the oven rack
      const rackCookies = [];
      for (let n = 0; n < 3; n++) {
        const c = cookie(oven, -0.28 + n * 0.28, 0.5, 0.8, 'classic', 0.125);
        rackCookies.push(c);
      }
      this.ovenBakingCookies.push(rackCookies);

      this.target(oven.children[0], 'oven');
      this.ovens.push(oven);
    }

    // Shelves / bakery display tower
    const shelf = new THREE.Group();
    shelf.position.set(4.55, 0.2, -2.45);
    g.add(shelf);
    box(2.2, 0.12, 0.7, darkWood, 0, 1.02, 0, shelf);
    box(2.2, 0.12, 0.7, darkWood, 0, 2.0, 0, shelf);
    box(2.2, 0.12, 0.7, darkWood, 0, 2.95, 0, shelf);
    for (const x of [-0.95, 0.95]) box(0.11, 3.0, 0.55, wood, x, 1.48, 0, shelf);

    // Pastry display jars and boxes on shelves
    for (let i = 0; i < 5; i++) {
      cookie(shelf, -0.76 + i * 0.38, 1.18, 0.04, i % 2 ? 'chip' : 'berry', 0.13);
      cylinder(0.13, 0.13, 0.32, mat(i % 2 ? '#8fb5a5' : '#f0c27b'), -0.75 + i * 0.37, 2.26, -0.02, shelf, 12);
      box(0.24, 0.18, 0.24, mat(i % 3 === 0 ? '#df9275' : '#e5caa0'), -0.72 + i * 0.36, 3.16, 0.02, shelf);
    }
    this.target(shelf.children[0], 'shelves');

    // Customer dining table & chairs
    const table = new THREE.Group();
    table.position.set(2.85, 0, 1.55);
    g.add(table);
    cylinder(0.74, 0.74, 0.13, cream, 0, 0.95, 0, table, 20);
    cylinder(0.1, 0.14, 0.92, wood, 0, 0.48, 0, table);
    for (const [x, z] of [[-0.44, -0.44], [0.44, -0.44], [-0.44, 0.44], [0.44, 0.44]]) {
      box(0.13, 0.68, 0.13, wood, x, 0.35, z, table);
    }
    for (const [x, z] of [[-1.12, 0], [1.12, 0], [0, -1.12]]) {
      box(0.62, 0.15, 0.62, mat('#d98c64'), x, 0.75, z, table);
      for (const lx of [-0.22, 0.22]) {
        for (const lz of [-0.22, 0.22]) {
          box(0.08, 0.68, 0.08, wood, x + lx, 0.38, z + lz, table);
        }
      }
    }
    plant(table, 0, 1.02, 0);
    this.target(table.children[0], 'table');

    // Outdoor potted plants & cafe lanterns
    for (const [x, z] of [[-5.2, 2.9], [5.2, -3.55]]) plant(g, x, 0, z);
    for (const x of [-2.8, 0, 2.8]) {
      box(0.055, 1.1, 0.055, darkWood, x, 4.2, -1.5, g);
      lamp(g, x, 3.68, -1.5);
    }

    // Doorway
    box(2.1, 0.06, 0.9, mat('#b9805a'), 0, 0.02, 4.12, g);
    const door = box(1.15, 2.35, 0.18, mat('#85a699'), 0, 1.18, -4.26, g);
    door.position.x = 5.12;
    this.target(door, 'door');

    // Kevin the Baker
    this.kevin = new THREE.Group();
    this.kevin.position.set(-1.0, 0, 2.0);
    g.add(this.kevin);
    this.buildKevin();

    const kevinHit = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.48, 0.82, 4, 8),
      new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false })
    );
    kevinHit.position.y = 1.05;
    this.kevin.add(this.target(kevinHit, 'kevin'));

    // Mission board on back wall
    const board = box(0.55, 0.68, 0.08, darkWood, -4.7, 2.15, -4.22, g);
    box(0.46, 0.58, 0.04, mat('#dfcaa8'), -4.7, 2.15, -4.16, g);
    this.target(board, 'board');

    this.setShopStyle('cozy', 'classic', 1);
  }

  refreshCounterDisplays(unlockedRecipes = ['classic']) {
    this.counterTrays.clear();
    const recipesToShow = unlockedRecipes.slice(0, 5);
    recipesToShow.forEach((recId, idx) => {
      const x = -1.45 + idx * 0.68;
      box(0.48, 0.03, 0.38, mat('#e2d0ba'), x, 1.5, 0.06, this.counterTrays);
      cookie(this.counterTrays, x - 0.1, 1.54, 0.06, recId, 0.11);
      cookie(this.counterTrays, x + 0.1, 1.54, 0.06, recId, 0.11);
    });
  }

  buildTiledFloor(parent) {
    const geometry = new THREE.BoxGeometry(0.96, 0.055, 0.96);
    const palette = [mat('#f1d8b3'), mat('#e8c79e'), mat('#f7e4c7')];
    const transforms = palette.map(() => []);
    const tile = new THREE.Object3D();

    for (let row = 0; row < 9; row++) {
      for (let column = 0; column < 12; column++) {
        const paletteIndex = (row + column) % 2 === 0 ? 0 : (row * 3 + column) % 11 === 0 ? 2 : 1;
        tile.position.set(-5.5 + column, -0.018, -4 + row);
        tile.updateMatrix();
        transforms[paletteIndex].push(tile.matrix.clone());
      }
    }

    transforms.forEach((matrices, index) => {
      if (!matrices.length) return;
      const tiles = new THREE.InstancedMesh(geometry, palette[index], matrices.length);
      matrices.forEach((matrix, i) => tiles.setMatrixAt(i, matrix));
      tiles.instanceMatrix.needsUpdate = true;
      tiles.receiveShadow = true;
      tiles.castShadow = false;
      parent.add(tiles);
    });
  }

  buildKevin() {
    this.kevin.clear();
    const shirt = mat('#e58f56');
    const skin = mat('#efbd91');

    const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.3, 0.52, 4, 8), shirt);
    torso.position.y = 0.85;
    torso.castShadow = true;
    this.kevin.add(torso);

    cylinder(0.16, 0.18, 0.12, mat('#384852'), -0.12, 0.37, 0, this.kevin, 10);
    cylinder(0.16, 0.18, 0.12, mat('#384852'), 0.12, 0.37, 0, this.kevin, 10);

    const head = new THREE.Mesh(new THREE.SphereGeometry(0.38, 14, 10), skin);
    head.position.set(0, 1.55, 0);
    head.castShadow = true;
    this.kevin.add(head);

    const hair = new THREE.Mesh(
      new THREE.SphereGeometry(0.4, 12, 8, 0, Math.PI * 2, 0, Math.PI * 0.53),
      mat('#634534')
    );
    hair.position.set(0, 1.62, 0);
    this.kevin.add(hair);

    for (const x of [-0.13, 0.13]) {
      const eye = new THREE.Mesh(new THREE.SphereGeometry(0.035, 6, 6), mat('#443833'));
      eye.position.set(x, 1.57, 0.34);
      this.kevin.add(eye);
    }
    const smile = new THREE.Mesh(new THREE.TorusGeometry(0.095, 0.018, 5, 8, Math.PI), mouthMaterial);
    smile.position.set(0, 1.38, 0.34);
    this.kevin.add(smile);

    const hat = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.29, 0.15, 12), cream);
    hat.position.y = 1.95;
    this.kevin.add(hat);
  }

  buildCustomers() {
    this.customerGroup = new THREE.Group();
    this.root.add(this.customerGroup);
    this.customers = [];

    CUSTOMER_STYLES.forEach((style, i) => {
      const person = new THREE.Group();
      const shirtMat = mat(style.shirt);
      const skinMat = mat(style.skin);
      const pantsMat = mat(style.pants);
      const hairMat = mat(style.hair);

      // Cute chubby torso
      const body = new THREE.Mesh(customerBodyGeometry, shirtMat);
      body.position.y = 0.58;
      body.castShadow = true;
      person.add(body);

      // Cute round head
      const headGroup = new THREE.Group();
      headGroup.position.set(0, 0.98, 0);
      person.add(headGroup);

      const head = new THREE.Mesh(customerHeadGeometry, skinMat);
      head.castShadow = true;
      headGroup.add(head);

      // Cheeks (cute blush)
      for (const x of [-0.17, 0.17]) {
        const cheek = new THREE.Mesh(customerCheekGeometry, cheekMaterial);
        cheek.position.set(x, -0.04, 0.22);
        headGroup.add(cheek);
      }

      // Expressive cartoon eyes with pupil highlight
      for (const x of [-0.1, 0.1]) {
        const eye = new THREE.Mesh(customerEyeGeometry, eyeWhiteMaterial);
        eye.position.set(x, 0.05, 0.245);
        const pupilHighlight = new THREE.Mesh(customerPupilHighlightGeometry, eyeHighlightMaterial);
        pupilHighlight.position.set(x * 0.2, 0.01, 0.024);
        eye.add(pupilHighlight);
        headGroup.add(eye);
      }

      // Sweet smile
      const mouth = new THREE.Mesh(customerMouthGeometry, mouthMaterial);
      mouth.position.set(0, -0.08, 0.245);
      mouth.rotation.x = Math.PI;
      headGroup.add(mouth);

      // Custom hair & accessories
      this.attachCustomerHairstyle(headGroup, style, hairMat);

      // Arms (with swinging joints for smooth walking & joyful celebration)
      const leftArmRoot = new THREE.Group();
      leftArmRoot.position.set(-0.25, 0.72, 0);
      person.add(leftArmRoot);
      const leftArmMesh = new THREE.Mesh(customerArmGeometry, shirtMat);
      leftArmMesh.position.set(0, -0.12, 0);
      leftArmRoot.add(leftArmMesh);
      const leftHand = new THREE.Mesh(customerHandGeometry, skinMat);
      leftHand.position.set(0, -0.27, 0);
      leftArmRoot.add(leftHand);

      const rightArmRoot = new THREE.Group();
      rightArmRoot.position.set(0.25, 0.72, 0);
      person.add(rightArmRoot);
      const rightArmMesh = new THREE.Mesh(customerArmGeometry, shirtMat);
      rightArmMesh.position.set(0, -0.12, 0);
      rightArmRoot.add(rightArmMesh);
      const rightHand = new THREE.Mesh(customerHandGeometry, skinMat);
      rightHand.position.set(0, -0.27, 0);
      rightArmRoot.add(rightHand);

      // Legs & shoes
      const legs = [];
      for (const x of [-0.11, 0.11]) {
        const legRoot = new THREE.Group();
        legRoot.position.set(x, 0.38, 0);
        person.add(legRoot);

        const leg = new THREE.Mesh(customerLegGeometry, pantsMat);
        leg.position.set(0, -0.16, 0);
        leg.castShadow = true;
        legRoot.add(leg);

        const shoe = new THREE.Mesh(customerShoeGeometry, mat('#332a26'));
        shoe.position.set(0, -0.34, 0.03);
        legRoot.add(shoe);

        legs.push(legRoot);
      }

      // Bakery treat: cute boxed cookie or wrapped delicacy
      const treatGroup = new THREE.Group();
      treatGroup.position.set(0, 0.65, 0.28);
      const boxMesh = new THREE.Mesh(treatBoxGeometry, treatBoxMaterial);
      treatGroup.add(boxMesh);
      const ribbon = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.21, 0.08), treatRibbonMaterial);
      treatGroup.add(ribbon);
      treatGroup.visible = false;
      person.add(treatGroup);

      // Floating happy reaction icon (heart or gold star)
      const reactionIcon = new THREE.Mesh(heartParticleGeometry, i % 2 ? heartMaterial : starMaterial);
      reactionIcon.position.set(0, 1.5, 0);
      reactionIcon.visible = false;
      person.add(reactionIcon);

      person.userData = {
        poolId: i,
        body,
        headGroup,
        leftArm: leftArmRoot,
        rightArm: rightArmRoot,
        legs,
        treat: treatGroup,
        reactionIcon,
        phase: 'idle',
        walkPhase: 0,
        idlePhase: Math.random() * 10,
        happyProgress: 0,
      };

      person.visible = false;
      this.customerGroup.add(person);
      this.customers.push(person);
    });
  }

  attachCustomerHairstyle(headGroup, style, hairMat) {
    if (style.hairType === 'bob') {
      const hair = new THREE.Mesh(new THREE.SphereGeometry(0.28, 12, 8, 0, Math.PI * 2, 0, Math.PI * 0.65), hairMat);
      hair.position.y = 0.04;
      headGroup.add(hair);
      const bangs = box(0.32, 0.1, 0.08, hairMat, 0, 0.18, 0.22, headGroup);
      bangs.rotation.x = -0.15;
    } else if (style.hairType === 'bun') {
      const hairBase = new THREE.Mesh(new THREE.SphereGeometry(0.28, 10, 8, 0, Math.PI * 2, 0, Math.PI * 0.55), hairMat);
      hairBase.position.y = 0.03;
      headGroup.add(hairBase);
      const bun = new THREE.Mesh(new THREE.SphereGeometry(0.14, 8, 6), hairMat);
      bun.position.set(0, 0.32, -0.05);
      headGroup.add(bun);
    } else if (style.hairType === 'curls') {
      const puff = new THREE.Mesh(new THREE.SphereGeometry(0.31, 10, 8), hairMat);
      puff.position.set(0, 0.06, -0.04);
      headGroup.add(puff);
    } else if (style.hairType === 'pigtails') {
      const base = new THREE.Mesh(new THREE.SphereGeometry(0.28, 10, 8, 0, Math.PI * 2, 0, Math.PI * 0.55), hairMat);
      base.position.y = 0.03;
      headGroup.add(base);
      for (const x of [-0.28, 0.28]) {
        const puff = new THREE.Mesh(new THREE.SphereGeometry(0.11, 7, 6), hairMat);
        puff.position.set(x, 0.16, -0.05);
        headGroup.add(puff);
      }
    } else {
      const shortHair = new THREE.Mesh(new THREE.SphereGeometry(0.28, 12, 8, 0, Math.PI * 2, 0, Math.PI * 0.52), hairMat);
      shortHair.position.y = 0.04;
      headGroup.add(shortHair);
    }

    // Hats
    if (style.hat === 'beret') {
      const beret = cylinder(0.26, 0.18, 0.1, mat('#d97252'), 0, 0.28, -0.02, headGroup, 10);
      beret.rotation.z = -0.15;
    } else if (style.hat === 'beanie') {
      const beanie = cylinder(0.24, 0.26, 0.18, mat('#e5a060'), 0, 0.26, 0, headGroup, 10);
      const pom = new THREE.Mesh(new THREE.SphereGeometry(0.065, 6, 5), mat('#fff4e0'));
      pom.position.set(0, 0.38, 0);
      headGroup.add(pom);
    } else if (style.hat === 'visor') {
      cylinder(0.24, 0.24, 0.08, mat('#3b4f63'), 0, 0.22, 0, headGroup, 10);
      box(0.28, 0.03, 0.18, mat('#3b4f63'), 0, 0.22, 0.22, headGroup);
    }

    // Accessories
    if (style.accessory === 'glasses') {
      for (const x of [-0.1, 0.1]) {
        const frame = new THREE.Mesh(new THREE.TorusGeometry(0.045, 0.012, 4, 8), darkWood);
        frame.position.set(x, 0.05, 0.26);
        headGroup.add(frame);
      }
      box(0.08, 0.015, 0.02, darkWood, 0, 0.05, 0.265, headGroup);
    } else if (style.accessory === 'scarf') {
      const scarf = cylinder(0.22, 0.24, 0.1, mat('#c45b52'), 0, -0.22, 0, headGroup, 10);
      scarf.rotation.x = 0.05;
    } else if (style.accessory === 'ribbon' || style.accessory === 'bow') {
      const bow = new THREE.Mesh(new THREE.SphereGeometry(0.065, 6, 5), mat('#f06b7a'));
      bow.position.set(0.18, 0.24, 0.14);
      headGroup.add(bow);
    }
  }

  buildBakingEffects() {
    this.steamParticles = Array.from({ length: 9 }, (_, i) => {
      const p = new THREE.Mesh(steamParticleGeometry, steamMaterial);
      p.visible = false;
      this.root.add(p);
      return {
        mesh: p,
        ovenIdx: i % 3,
        offset: (i % 3 - 1) * 0.22,
        life: 0,
      };
    });
  }

  buildTransferEffects() {
    this.transferCookies = Array.from({ length: 6 }, (_, i) => {
      const mesh = new THREE.Mesh(transferCookieGeometry, goldMat);
      mesh.visible = false;
      this.root.add(mesh);
      return {
        mesh,
        startPos: new THREE.Vector3(),
        targetPos: new THREE.Vector3(),
        active: false,
        startTime: 0,
        duration: 900,
        curveHeight: 1.6 + (i % 2) * 0.4,
      };
    });
  }

  setBakingState(baking) {
    if (!baking) {
      this.bakingProgress = 0;
      this.bakingReady = false;
      this.ovenLights.forEach(light => {
        light.material.color.set('#394142');
        light.material.emissive.set('#111111');
      });
      this.ovenWindows.forEach(win => {
        win.material.color.set('#523223');
        win.material.emissive.set('#331508');
        win.material.emissiveIntensity = 0.1;
      });
      return;
    }

    this.bakingProgress = baking.progress || 0;
    this.bakingReady = Boolean(baking.ready);

    const ready = this.bakingReady;
    const prog = this.bakingProgress;

    // Window glow transition
    this.ovenWindows.forEach((win, idx) => {
      if (ready) {
        win.material.color.set('#ffd700');
        win.material.emissive.set('#ffb300');
        win.material.emissiveIntensity = 0.85;
      } else {
        const intensity = 0.25 + prog * 0.6;
        win.material.color.set('#ff8a3d');
        win.material.emissive.set('#ff5722');
        win.material.emissiveIntensity = intensity;
      }
    });

    // Oven indicator lights
    this.ovenLights.forEach(light => {
      if (ready) {
        light.material.color.set('#4caf50');
        light.material.emissive.set('#66bb6a');
        light.material.emissiveIntensity = 0.9;
      } else {
        light.material.color.set('#ff9800');
        light.material.emissive.set('#ff9800');
        light.material.emissiveIntensity = 0.5 + prog * 0.3;
      }
    });

    // Oven baking cookie dough color change
    this.ovenBakingCookies.forEach(rack => {
      rack.forEach(c => {
        if (ready) {
          c.material.color.set('#b86c2d');
        } else {
          // Pale dough gradually becomes golden
          const col = new THREE.Color('#f5ddbe').lerp(new THREE.Color('#b86c2d'), prog);
          c.material.color.copy(col);
        }
      });
    });
  }

  finishBaking(total = 30) {
    this.bakingReady = true;
    const now = performance.now();

    // Trigger golden cookie flying transfer animation from ovens to counter display
    this.transferCookies.forEach((tc, i) => {
      tc.active = true;
      tc.startTime = now + i * 90;
      tc.mesh.visible = true;
      const ovenX = -4.25 + (i % 3) * 1.7;
      tc.startPos.set(ovenX, 1.45, -2.65);
      tc.targetPos.set(-1.2 + (i % 4) * 0.5, 1.6, 0.1);
      tc.mesh.position.copy(tc.startPos);
    });
  }

  startCustomers(count, arrivalInterval, onCounter, onComplete) {
    this.clearCustomerFlow();
    const total = THREE.MathUtils.clamp(Math.floor(count), 0, 60);
    this.customerFlow = {
      total,
      arrived: 0,
      completed: 0,
      arrivalInterval: THREE.MathUtils.clamp(arrivalInterval, 350, 1200),
      nextArrival: performance.now() + 80,
      queue: [],
      inService: null,
      onCounter,
      onComplete,
      finishSent: false,
    };
    this.customers.forEach(person => {
      person.visible = false;
      person.userData.phase = 'idle';
      person.userData.reactionIcon.visible = false;
      person.userData.treat.visible = false;
    });
    if (total === 0) this.finishCustomerFlow();
  }

  clearCustomerFlow() {
    this.customerFlow = null;
    this.customers?.forEach(person => {
      person.visible = false;
      person.userData.phase = 'idle';
      person.userData.reactionIcon.visible = false;
      person.userData.treat.visible = false;
    });
  }

  spawnCustomer(now) {
    const flow = this.customerFlow;
    if (!flow || flow.arrived >= flow.total || flow.queue.length >= 8) return false;
    const person = this.customers.find(candidate => !candidate.visible);
    if (!person) return false;

    const taskId = `${flow.arrived}:${person.userData.poolId}`;
    person.visible = true;
    person.position.set(-4.8, 0, 5.25);
    person.userData.taskId = taskId;
    person.userData.phase = 'walkIn';
    person.userData.routeStage = 0;
    person.userData.waitStarted = 0;
    person.userData.counterCalled = false;
    person.userData.walkPhase = now * 0.01;
    person.userData.happyProgress = 0;
    person.userData.treat.visible = false;
    person.userData.reactionIcon.visible = false;

    flow.queue.push(person);
    flow.arrived += 1;
    flow.nextArrival = now + flow.arrivalInterval;
    return true;
  }

  queuePosition(index) {
    return { x: -2.55 - index * 0.48, z: 1.22 + index * 0.16 };
  }

  moveCustomer(person, x, z, speed, delta) {
    const dx = x - person.position.x;
    const dz = z - person.position.z;
    const distance = Math.hypot(dx, dz);
    if (distance < 0.065) {
      person.position.x = x;
      person.position.z = z;
      return true;
    }
    const step = Math.min(distance, speed * delta);
    person.position.x += (dx / distance) * step;
    person.position.z += (dz / distance) * step;
    person.rotation.y = Math.atan2(dx, dz);
    return false;
  }

  beginNextCustomer() {
    const flow = this.customerFlow;
    if (!flow || flow.inService || !flow.queue.length) return;
    const next = flow.queue[0];
    if (next.userData.phase !== 'queue') return;
    const slot = this.queuePosition(0);
    if (Math.hypot(next.position.x - slot.x, next.position.z - slot.z) > 0.1) return;
    flow.inService = next;
    flow.inService.userData.phase = 'walkToCounter';
  }

  waitForStock(taskId) {
    const person = this.findCustomer(taskId);
    if (!person || person.userData.phase !== 'atCounter') return;
    person.userData.phase = 'waitingStock';
    person.userData.waitStarted = performance.now();
  }

  releaseWaitingCustomers() {
    const flow = this.customerFlow;
    if (!flow || !flow.inService || flow.inService.userData.phase !== 'waitingStock') return;
    flow.inService.userData.phase = 'atCounter';
    flow.inService.userData.waitStarted = 0;
    flow.onCounter?.(flow.inService.userData.taskId);
  }

  findCustomer(taskId) {
    return this.customers.find(person => person.visible && person.userData.taskId === taskId);
  }

  completeCustomer(taskId, cookiesBought = 0) {
    const flow = this.customerFlow;
    const person = this.findCustomer(taskId);
    if (!flow || !person || !['atCounter', 'waitingStock'].includes(person.userData.phase)) return false;

    flow.queue = flow.queue.filter(customer => customer !== person);
    if (flow.inService === person) flow.inService = null;

    if (cookiesBought > 0) {
      // Trigger Happy Reaction Animation!
      person.userData.phase = 'happyReaction';
      person.userData.happyStart = performance.now();
      person.userData.treat.visible = true;
      person.userData.reactionIcon.visible = true;
      person.userData.reactionIcon.scale.set(0.1, 0.1, 0.1);
      person.userData.cookiesBought = cookiesBought;
    } else {
      person.userData.phase = 'leaving';
      person.userData.routeStage = 0;
      person.userData.treat.visible = false;
      person.userData.reactionIcon.visible = false;
    }

    flow.completed += 1;
    this.repositionQueue();
    this.beginNextCustomer();
    return true;
  }

  repositionQueue() {
    const flow = this.customerFlow;
    if (!flow) return;
    flow.queue.forEach((person, index) => {
      person.userData.queueIndex = index;
    });
  }

  updateCustomerFlow(now, delta) {
    const flow = this.customerFlow;
    if (!flow || this.paused) return;

    if (flow.arrived < flow.total && now >= flow.nextArrival && flow.queue.length < 8) {
      this.spawnCustomer(now);
    }
    this.beginNextCustomer();

    for (const person of this.customers) {
      if (!person.visible) continue;
      const user = person.userData;
      const phase = user.phase;

      const walk = ['walkIn', 'walkToCounter', 'leaving'].includes(phase);
      const isQueue = phase === 'queue';
      const isWaiting = phase === 'waitingStock';
      const isHappy = phase === 'happyReaction';

      if (walk) {
        // Natural walking animation: synchronized arm & leg swing with bounce
        const stride = Math.sin(now * 0.012 + user.walkPhase);
        const bob = Math.abs(Math.sin(now * 0.012 + user.walkPhase)) * 0.05;
        person.position.y = bob;

        // Legs swing
        user.legs[0].rotation.x = stride * 0.38;
        user.legs[1].rotation.x = -stride * 0.38;

        // Arms swing opposite to legs
        user.leftArm.rotation.x = -stride * 0.32;
        user.rightArm.rotation.x = stride * 0.32;
        user.leftArm.rotation.z = -0.05;
        user.rightArm.rotation.z = 0.05;

        // Gentle head bob
        user.headGroup.rotation.z = -stride * 0.03;
      } else if (isQueue) {
        // Idle animation in queues: gentle breathing, weight shifting, looking around
        const idle = now * 0.003 + user.idlePhase;
        const breath = Math.sin(idle * 1.5) * 0.012;
        person.position.y = 0;
        user.body.scale.set(1 + breath, 1 + breath, 1 + breath);

        // Subtle weight shift from foot to foot
        const shift = Math.sin(idle * 0.8) * 0.03;
        person.rotation.z = shift;

        // Looking around with curiosity
        user.headGroup.rotation.y = Math.sin(idle * 0.5) * 0.22;
        user.headGroup.rotation.x = Math.sin(idle * 0.7) * 0.04;

        // Relaxed arms
        user.leftArm.rotation.set(0, 0, -0.08);
        user.rightArm.rotation.set(0, 0, 0.08);
        user.legs.forEach(leg => { leg.rotation.x = 0; });
      } else if (isWaiting) {
        // Patient anticipation foot tap
        const tap = Math.sin(now * 0.015) > 0.5 ? 0.08 : 0;
        user.legs[1].rotation.x = tap;
        user.headGroup.rotation.x = 0.08;
      } else if (isHappy) {
        // Happy jump / reaction when purchase succeeds!
        const elapsed = now - user.happyStart;
        const progress = Math.min(1, elapsed / 650);

        // Joyful bounce
        const hop = Math.sin(progress * Math.PI) * 0.28;
        person.position.y = Math.max(0, hop);

        // Hands raised in delight!
        const joyArm = Math.sin(progress * Math.PI) * 1.8;
        user.leftArm.rotation.z = -0.2 - joyArm;
        user.rightArm.rotation.z = 0.2 + joyArm;

        // Floating heart/star icon
        if (user.reactionIcon) {
          user.reactionIcon.visible = true;
          user.reactionIcon.position.y = 1.45 + progress * 0.45;
          const iconScale = Math.sin(progress * Math.PI) * 1.3;
          user.reactionIcon.scale.setScalar(Math.max(0.01, iconScale));
          user.reactionIcon.rotation.y = now * 0.008;
        }

        if (progress >= 1) {
          user.phase = 'leaving';
          user.routeStage = 0;
          user.reactionIcon.visible = false;
        }
      }

      // Movement logic
      if (phase === 'walkIn') {
        if (this.moveCustomer(person, -4.55, 2.9, 2.5, delta)) user.phase = 'queue';
      } else if (phase === 'queue') {
        const slot = this.queuePosition(user.queueIndex ?? 0);
        this.moveCustomer(person, slot.x, slot.z, 2.6, delta);
      } else if (phase === 'walkToCounter') {
        if (this.moveCustomer(person, -1.45, 1.08, 2.7, delta)) {
          user.phase = 'atCounter';
          user.counterCalled = true;
          flow.onCounter?.(user.taskId);
        }
      } else if (phase === 'waitingStock') {
        if (now - user.waitStarted > 8000) this.completeCustomer(user.taskId, 0);
      } else if (phase === 'leaving') {
        const exit = user.routeStage === 0 ? [-4.55, 2.9] : [-4.8, 5.4];
        if (this.moveCustomer(person, exit[0], exit[1], 3.0, delta)) {
          if (user.routeStage === 0) user.routeStage = 1;
          else {
            person.visible = false;
            user.phase = 'idle';
            user.treat.visible = false;
            user.reactionIcon.visible = false;
          }
        }
      }
    }

    this.repositionQueue();
    this.beginNextCustomer();

    if (
      flow.arrived >= flow.total &&
      flow.completed >= flow.total &&
      this.customers.every(person => !person.visible)
    ) {
      this.finishCustomerFlow();
    }
  }

  finishCustomerFlow() {
    const flow = this.customerFlow;
    if (!flow || flow.finishSent) return;
    flow.finishSent = true;
    flow.onComplete?.();
  }

  getCustomerMetrics() {
    const flow = this.customerFlow;
    if (!flow) return { arrived: 0, total: 0, active: 0, queue: 0, served: 0 };
    return {
      arrived: flow.arrived,
      total: flow.total,
      active: this.customers.filter(person => person.visible).length,
      queue: flow.queue.length,
      served: flow.completed,
    };
  }

  setPaused(paused) {
    const next = Boolean(paused);
    if (next === this.paused) return;
    if (next) {
      this.paused = true;
      this.pauseStarted = performance.now();
      return;
    }
    const elapsed = performance.now() - (this.pauseStarted || performance.now());
    if (this.customerFlow) this.customerFlow.nextArrival += elapsed;
    this.customers.forEach(person => {
      if (person.userData.waitStarted) person.userData.waitStarted += elapsed;
    });
    this.paused = false;
  }

  setShopStyle(decor, outfit, level) {
    const palettes = {
      cozy: ['#dce9e7', '#fff0d1'],
      mint: ['#d4e8df', '#d9eee4'],
      pink: ['#f1d5dc', '#f4e3db'],
      midnight: ['#cfd5e3', '#e2e0ed'],
    };
    this.scene.background.set(palettes[decor]?.[0] || palettes.cozy[0]);

    const shirt =
      { classic: '#e58f56', mint: '#58a892', berry: '#b76074', star: '#5966ae' }[outfit] || '#e58f56';
    if (this.kevin.children[0]?.material) {
      this.kevin.children[0].material.color.set(shirt);
    }
    this.kevin.scale.setScalar(1 + Math.min(0.08, (level - 1) * 0.008));
  }

  bindControls() {
    this.raycaster = new THREE.Raycaster();
    this.pointer = new THREE.Vector2();
    this.drag = null;
    const el = this.renderer.domElement;

    el.addEventListener('pointerdown', e => {
      this.drag = { x: e.clientX, y: e.clientY, moved: false };
      el.setPointerCapture(e.pointerId);
    });

    el.addEventListener('pointermove', e => {
      if (!this.drag) {
        const rect = el.getBoundingClientRect();
        this.pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        this.pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
        this.raycaster.setFromCamera(this.pointer, this.camera);
        const hits = this.raycaster.intersectObjects(this.clickTargets, true);
        el.style.cursor = hits.some(hit => hit.object.userData.interactive) ? 'pointer' : 'grab';
        return;
      }
      if (this.locked) return;
      const dx = e.clientX - this.drag.x;
      const dy = e.clientY - this.drag.y;
      if (Math.abs(dx) + Math.abs(dy) > 2) this.drag.moved = true;
      this.targetYaw = THREE.MathUtils.clamp(this.targetYaw + dx * 0.004, -0.45, 1.75);
      this.targetPitch = THREE.MathUtils.clamp(this.targetPitch - dy * 0.0025, 0.48, 0.78);
      this.drag.x = e.clientX;
      this.drag.y = e.clientY;
    });

    el.addEventListener('pointerup', e => {
      if (this.drag && !this.drag.moved) {
        const rect = el.getBoundingClientRect();
        this.pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        this.pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
        this.raycaster.setFromCamera(this.pointer, this.camera);
        const found = this.raycaster
          .intersectObjects(this.clickTargets, true)
          .find(hit => hit.object.userData.interactive);
        if (found) this.onClick(found.object.userData.interactive);
      }
      this.drag = null;
    });

    el.addEventListener(
      'wheel',
      e => {
        e.preventDefault();
        this.zoom(e.deltaY > 0 ? 1 : -1);
      },
      { passive: false }
    );
  }

  updateCameraFrustum(width, height) {
    this.aspect = width / height;
    const verticalSpan = Math.max(12.5, 16 / this.aspect);
    this.camera.left = (-verticalSpan * this.aspect) / 2;
    this.camera.right = (verticalSpan * this.aspect) / 2;
    this.camera.top = verticalSpan / 2;
    this.camera.bottom = -verticalSpan / 2;
    this.camera.updateProjectionMatrix();
  }

  positionCamera() {
    const horizontal = this.cameraDistance * Math.cos(this.cameraPitch);
    this.camera.position.set(
      this.cameraTarget.x + horizontal * Math.sin(this.cameraYaw),
      this.cameraTarget.y + this.cameraDistance * Math.sin(this.cameraPitch),
      this.cameraTarget.z + horizontal * Math.cos(this.cameraYaw)
    );
    this.camera.lookAt(this.cameraTarget);
  }

  zoom(direction) {
    this.targetZoom = THREE.MathUtils.clamp(this.targetZoom - direction * 0.12, 0.72, 1.55);
  }

  rotate(direction) {
    if (!this.locked) this.targetYaw = THREE.MathUtils.clamp(this.targetYaw + direction * 0.16, -0.45, 1.75);
  }

  setCameraLocked(locked) {
    this.locked = Boolean(locked);
  }

  onResize() {
    const w = this.container.clientWidth;
    const h = this.container.clientHeight;
    if (!w || !h) return;
    this.updateCameraFrustum(w, h);
    this.renderer.setSize(w, h);
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, 1.25));
    this.renderer.shadowMap.enabled = w > 620;
    this.sun.castShadow = w > 620;
  }

  animate(now) {
    this.frame = requestAnimationFrame(this.animate);
    const delta = this.lastFrame
      ? THREE.MathUtils.clamp((now - this.lastFrame) / 1000, 0, 0.05)
      : 1 / 60;
    this.lastFrame = now;

    this.cameraYaw += (this.targetYaw - this.cameraYaw) * 0.12;
    this.cameraPitch += (this.targetPitch - this.cameraPitch) * 0.12;
    this.cameraZoom += (this.targetZoom - this.cameraZoom) * 0.16;

    if (Math.abs(this.camera.zoom - this.cameraZoom) > 0.001) {
      this.camera.zoom = this.cameraZoom;
      this.camera.updateProjectionMatrix();
    }
    this.positionCamera();

    this.updateCustomerFlow(now, delta);

    // Subtle oven steam animation while baking
    const isBakingActive = this.bakingProgress > 0 && !this.bakingReady;
    this.steamParticles.forEach(sp => {
      if (isBakingActive) {
        if (!sp.mesh.visible || sp.life >= 1) {
          sp.mesh.visible = true;
          sp.life = 0;
          const ovenX = -4.25 + sp.ovenIdx * 1.7;
          sp.mesh.position.set(ovenX + sp.offset, 1.85, -2.65);
        } else {
          sp.life += delta * 1.2;
          sp.mesh.position.y += delta * 0.35;
          sp.mesh.position.x += Math.sin(now * 0.005 + sp.offset) * delta * 0.08;
          const scale = (1 - sp.life) * 1.1;
          sp.mesh.scale.setScalar(Math.max(0.1, scale));
          sp.mesh.material.opacity = Math.max(0, (1 - sp.life) * 0.5);
        }
      } else {
        sp.mesh.visible = false;
      }
    });

    // Golden cookie transfer arc animation from oven to counter
    this.transferCookies.forEach(tc => {
      if (!tc.active) return;
      if (now < tc.startTime) return;
      const progress = (now - tc.startTime) / tc.duration;
      if (progress >= 1) {
        tc.active = false;
        tc.mesh.visible = false;
      } else {
        tc.mesh.visible = true;
        // Parabolic arc curve
        tc.mesh.position.lerpVectors(tc.startPos, tc.targetPos, progress);
        tc.mesh.position.y += Math.sin(progress * Math.PI) * tc.curveHeight;
        tc.mesh.rotation.x = progress * Math.PI * 4;
        tc.mesh.rotation.y = progress * Math.PI * 2;
      }
    });

    // Kevin gentle idle breathing / sway
    this.kevin.rotation.y = Math.sin(now * 0.0008) * 0.07;

    this.renderer.render(this.scene, this.camera);
  }

  dispose() {
    cancelAnimationFrame(this.frame);
    this.resize.disconnect();
    this.clearCustomerFlow();
    const geometries = new Set();
    const materials = new Set();
    this.scene.traverse(object => {
      if (object.geometry) geometries.add(object.geometry);
      if (Array.isArray(object.material)) object.material.forEach(material => materials.add(material));
      else if (object.material) materials.add(object.material);
    });
    geometries.forEach(geometry => geometry.dispose());
    materials.forEach(material => material.dispose());
    this.renderer.dispose();
    this.renderer.domElement.remove();
  }
}
