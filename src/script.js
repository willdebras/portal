import './style.css'
import * as dat from 'lil-gui'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js'
import firefliesVertexShader from './shaders/fireflies/vertex.glsl'
import firefliesFragmentShader from './shaders/fireflies/fragment.glsl'
import portalVertexShader from './shaders/portal/vertex.glsl'
import portalFragmentShader from './shaders/portal/fragment.glsl'


/**
 * Base
 */
// Debug

const debugObject = {}

const gui = new dat.GUI({
    width: 400
})

// Canvas
const canvas = document.querySelector('canvas.webgl')

// Scene
const scene = new THREE.Scene()

/**
 * Loaders
 */
// Texture loader
const textureLoader = new THREE.TextureLoader()

// Draco loader
const dracoLoader = new DRACOLoader()
dracoLoader.setDecoderPath('draco/')

// GLTF loader
const gltfLoader = new GLTFLoader()
gltfLoader.setDRACOLoader(dracoLoader)

/**
 * Textures
 */

const bakedTexture = textureLoader.load('baked.jpg')
bakedTexture.flipY = false

// encoding needed on input but also output below
bakedTexture.encoding = THREE.sRGBEncoding

/**
 * Materials
 */

// Baked materials
const bakedMaterial = new THREE.MeshBasicMaterial({map: bakedTexture})

// Pole lights
const poleLightMaterial = new THREE.MeshBasicMaterial({color: 0xffffe5})

// Portal light material

debugObject.portalColorStart = '#9B4CE4'
debugObject.portalColorEnd = '#feecff'

gui.addColor(debugObject, 'portalColorStart').onChange(()=> {portalLightMaterial.uniforms.uColorStart.value.set(debugObject.portalColorStart)})
gui.addColor(debugObject, 'portalColorEnd').onChange(()=> {portalLightMaterial.uniforms.uColorEnd.value.set(debugObject.portalColorEnd)})

const portalLightMaterial = new THREE.ShaderMaterial({
    uniforms: {
        uTime: {value: 0},
        uOuterGlow: {value: 5.0},
        uSharpness: {value: 0.7},
        uSpeedFactor: {value: 1.0},
        uColorStart: {value: new THREE.Color(debugObject.portalColorStart)},
        uColorEnd: {value: new THREE.Color(debugObject.portalColorEnd)}
    },
    vertexShader: portalVertexShader,
    fragmentShader: portalFragmentShader
})

gltfLoader.load(
    'portal.glb',
    (gltf) => {
        // Traverse needed if multiple children, not needed with baked child
        // gltf.scene.traverse((child) => {
        //     child.material = bakedMaterial
        // })
        const bakedMesh = gltf.scene.children.find(child => child.name === 'baked')
        bakedMesh.material = bakedMaterial

        const portalLightMesh = gltf.scene.children.find(child => child.name === 'portalLight')
        const poleLightAMesh = gltf.scene.children.find(child => child.name === 'poleLightA')
        const poleLightBMesh = gltf.scene.children.find(child => child.name === 'poleLightB')
        
        portalLightMesh.material = portalLightMaterial
        poleLightAMesh.material = poleLightMaterial
        poleLightBMesh.material = poleLightMaterial

        scene.add(gltf.scene)
    }

)

/**
 * Fireflies
 */
const firefliesGeometry = new THREE.BufferGeometry()
const firefliesCount = 30
const positionArray = new Float32Array(firefliesCount * 3)
const scaleArray = new Float32Array(firefliesCount)



for(let i = 0; i < firefliesCount; i++) {
    positionArray[i * 3 + 0] = (Math.random() - 0.5) * 4
    positionArray[i * 3 + 1] = (Math.random() * 1.5) * 2.5
    positionArray[i * 3 + 2] = (Math.random() - 0.5) * 4

    scaleArray[i] = Math.random()

}

firefliesGeometry.setAttribute('position', new THREE.BufferAttribute(positionArray, 3))
firefliesGeometry.setAttribute('aScale', new THREE.BufferAttribute(scaleArray, 1))

// Material
const firefliesMaterial = new THREE.ShaderMaterial({
    uniforms: {
        uTime: {value: 0},
        uPixelRatio: { value: Math.min(window.devicePixelRatio, 2)},
        uSize: { value: 200}
    },
    vertexShader: firefliesVertexShader,
    fragmentShader: firefliesFragmentShader,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false
})

gui.add(firefliesMaterial.uniforms.uSize, 'value').min(0).max(500).step(1).name('firefliesSize')

const fireflies = new THREE.Points(firefliesGeometry, firefliesMaterial)
scene.add(fireflies)

/**
 * Raycaster
 */

 const raycaster = new THREE.Raycaster()

/**
 * Sizes
 */
const sizes = {
    width: window.innerWidth,
    height: window.innerHeight
}

window.addEventListener('resize', () =>
{
    // Update sizes
    sizes.width = window.innerWidth
    sizes.height = window.innerHeight

    // Update camera
    camera.aspect = sizes.width / sizes.height
    camera.updateProjectionMatrix()

    // Update renderer
    renderer.setSize(sizes.width, sizes.height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

    firefliesMaterial.uniforms.uPixelRatio.value = Math.min(window.devicePixelRatio, 2)
})

/**
 * Listener for mouse position to detect hovers
 */

 const mouse = new THREE.Vector2()

 window.addEventListener('mousemove', (_event) => {
     mouse.x = _event.clientX / sizes.width * 2 - 1
     mouse.y = - (_event.clientY / sizes.height) * 2 + 1
 
 })

 /**
 * Click events
 */

window.addEventListener('mousedown', () => {
    if(currentIntersect) {
        
        switch(currentIntersect.object.name) {
            case 'portalLight':
                window.open('https://github.com/willdebras');
                break
            // Could add handling for other objects here, need to add to objectsToIntersect and replace with portal in tick function below
            case 'poleLightA':
                console.log('click on object 2')
                break

            case 'poleLightB':
                console.log('click on object 3')
                break
        }

    }
})

/**
 * Camera
 */
// Base camera
const camera = new THREE.PerspectiveCamera(45, sizes.width / sizes.height, 0.1, 100)
camera.position.x = 3
camera.position.y = 2.5
camera.position.z = 6.5
scene.add(camera)

gui.add(camera.position, 'x', -20, 20, 0.0001).name('camx')
gui.add(camera.position, 'y', -20, 20, 0.0001).name('camy')
gui.add(camera.position, 'z', -20, 20, 0.0001).name('camz')

// Controls
const controls = new OrbitControls(camera, canvas)
controls.enableDamping = true

controls.target = new THREE.Vector3(0, 0.75, 0)

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    antialias: true
})
renderer.setSize(sizes.width, sizes.height)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

debugObject.clearColor = '#201919'
renderer.setClearColor(debugObject.clearColor)
gui.addColor(debugObject, 'clearColor').onChange(() => {renderer.setClearColor(debugObject.clearColor)})

renderer.outputEncoding = THREE.sRGBEncoding


/**
 * Animate
 */
const clock = new THREE.Clock()

let currentIntersect = null

const tick = () =>
{
    const elapsedTime = clock.getElapsedTime()

    raycaster.setFromCamera(mouse, camera)

    const portal = scene.getObjectByName("portalLight", true);

    if(portal) {
        const intersects = raycaster.intersectObject(portal)

        if(intersects.length) {
            if(currentIntersect === null) {
                document.body.style.cursor = "pointer";
                portalLightMaterial.uniforms.uOuterGlow.value = 4.0
                portalLightMaterial.uniforms.uSharpness.value = 0.6
                portalLightMaterial.uniforms.uSpeedFactor.value = 5.0
            } 
    
            currentIntersect = intersects[0]
        } else {
            if(currentIntersect) {
                document.body.style.cursor = "default";
                portalLightMaterial.uniforms.uOuterGlow.value = 5.0
                portalLightMaterial.uniforms.uSharpness.value = 0.7
                portalLightMaterial.uniforms.uSpeedFactor.value = 1.0
            }
            currentIntersect = null
        }

    }



    //Update our uniforms in shader
    portalLightMaterial.uniforms.uTime.value = elapsedTime
    firefliesMaterial.uniforms.uTime.value = elapsedTime

    // Update controls
    controls.update()

    // Render
    renderer.render(scene, camera)

    // Call tick again on the next frame
    window.requestAnimationFrame(tick)
}

tick()