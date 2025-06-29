import * as THREE from 'three'
import { FontLoader } from 'three/addons/loaders/FontLoader.js'
import { SVGLoader } from 'three/addons/loaders/SVGLoader.js'
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js'

function debug(value) {
    document.getElementsByTagName('input')[0].value = `${value}`
}

if (DeviceOrientationEvent.requestPermission) {
    document.body.addEventListener('click', async () => {
        if (await DeviceOrientationEvent.requestPermission() !== 'granted') {
            return
        }

        run({
            orient: ({ head }, { alpha, beta, gamma }) => {
                gamma = gamma >= 0 ? gamma - 90 : gamma + 90
                alpha = gamma >= 0 ? alpha - 180 : alpha

                head.setRotationFromQuaternion(
                    (new THREE.Quaternion()).setFromEuler(new THREE.Euler(
                        THREE.MathUtils.degToRad(gamma),
                        THREE.MathUtils.degToRad(alpha),
                        THREE.MathUtils.degToRad(0),
                        'ZYX'
                    ))
                )
            }
        })
    }, { once: true })
} else {
    run({})
}

function sphere_coord(row, col, depth) {
    const theta = row * Math.PI / 16
    const phi = col * Math.PI / 16
    const rho = depth * Math.cos(theta)
    return [
        rho * Math.sin(phi),
        depth * Math.sin(theta),
        -rho * Math.cos(phi)
    ]
}

function run({ orient }) {
    const width = window.innerWidth
    const height = window.innerHeight

    const eyeSeparation = 0.1
    const cameraDistance = 0.5
    const cameraFov = 45

    const scene = new THREE.Scene()

    const head = new THREE.Group()
    scene.add(head)

    const cameraLeft = new THREE.PerspectiveCamera(cameraFov, width / 2 / height, 0.1, 1000)
    cameraLeft.position.x = -eyeSeparation / 2
    cameraLeft.position.z = cameraDistance
    head.add(cameraLeft)

    const cameraRight = new THREE.PerspectiveCamera(cameraFov, width / 2 / height, 0.1, 1000)
    cameraRight.position.x = eyeSeparation / 2
    cameraRight.position.z = cameraDistance
    head.add(cameraRight)

    const renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setPixelRatio(window.devicePixelRatio)
    renderer.setSize(width, height)
    document.body.appendChild(renderer.domElement)

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4)
    scene.add(ambientLight)

    const cursor = new THREE.Mesh(
        new THREE.CircleGeometry(0.01, 4),
        new THREE.MeshBasicMaterial({ color: 0x777755 })
    )
    cursor.position.set(0, 0, -3 - cameraDistance)
    head.add(cursor)

    const fontLoader = new FontLoader()
    fontLoader.load(
        'https://cdn.jsdelivr.net/npm/three@0.161/examples/fonts/helvetiker_regular.typeface.json',
        (font) => {
            const svgLoader = new SVGLoader()

            for (const [row, col, depth, text, icon] of [
                [-1.5, -1, 8, 'reload', 'System/reset-left'],
                [1.5, 0.75, 8, 'calendar', 'Business/calendar'],
                [1.5, 1.5, 8, 'clock', 'System/time'],
                [-0.5, 0, 6, 'photos', 'Media/image-2'],
                [0, 0, 5, 'mail', 'Business/mail'],
                [0.5, 0, 6, 'news', 'Document/article']
            ]) {
                const [x, y, z] = sphere_coord(row, col, depth)

                const mesh = new THREE.Mesh(
                    new TextGeometry(text, { font, size: 0.1, height: 0 }),
                    new THREE.MeshBasicMaterial({ color: 0x777799 })
                )
                mesh.position.set(x, y, z)
                mesh.lookAt(0, 0, 0)
                scene.add(mesh)

                svgLoader.load(
                    `https://cdn.jsdelivr.net/npm/remixicon@4.6.0/icons/${icon}-line.svg`,
                    (data) => {
                        const group = new THREE.Group()

                        for (const path of data.paths) {
                            const material = new THREE.MeshBasicMaterial({
                                color: 0x777799,
                                side: THREE.DoubleSide
                            })

                            for (const shape of SVGLoader.createShapes(path)) {
                                const mesh = new THREE.Mesh(new THREE.ShapeGeometry(shape), material)
                                group.add(mesh)
                            }
                        }

                        group.scale.set(-0.01, -0.01, -0.01)
                        group.position.set(x - 0.1, y + 0.175, z)
                        group.lookAt(0, 0, 0)
                        scene.add(group)
                    }
                )
            }
        }
    )

    renderer.setAnimationLoop(() => {
        const width = window.innerWidth
        const height = window.innerHeight

        renderer.setViewport(0, 0, width / 2, height)
        renderer.setScissor(0, 0, width / 2, height)
        renderer.setScissorTest(true)
        renderer.render(scene, cameraLeft)

        renderer.setViewport(window.innerWidth / 2, 0, width / 2, height)
        renderer.setScissor(window.innerWidth / 2, 0, width / 2, height)
        renderer.setScissorTest(true)
        renderer.render(scene, cameraRight)
    })

    window.addEventListener('resize', () => {
        const width = window.innerWidth
        const height = window.innerHeight

        cameraLeft.aspect = (width / 2) / height
        cameraLeft.updateProjectionMatrix()

        cameraRight.aspect = (width / 2) / height
        cameraRight.updateProjectionMatrix()

        renderer.setSize(width, height)
    })

    if (orient) {
        window.addEventListener(
            'deviceorientation',
            (event) => orient({ head }, event)
        )
    }
}
