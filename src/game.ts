import utils from '../node_modules/decentraland-ecs-utils/index'
import { movePlayerTo } from '@decentraland/RestrictedActions'
// import { getUserPublicKey } from '@decentraland/Identity'
import { getParcel } from '@decentraland/ParcelIdentity'

// const nftsUrl = 'https://api.rarible.org/v0.1/items/byOwner?owner=ETHEREUM:0x378BCce7235D53BBc3774BFf8559191F06E6818E'
const nftsUrl = 'https://eth-mainnet.g.alchemy.com/v2/Z8JNiWNLZTHZoKDcy3F35IvyMw7CPOM9/getNFTs/' +
                '?owner=0x378BCce7235D53BBc3774BFf8559191F06E6818E&' +
                'contractAddresses[]=0x857F47fEef68289da771Bf9c63532CF8A7A3472B&' + // Tux
                'contractAddresses[]=0x3b3ee1931dc30c1957379fac9aba94d1c48a5405&' + // Foundation
                'contractAddresses[]=0xb932a70a57673d89f4acffbe830e8ed7f75fb9e0&' + // SuperRare
                'contractAddresses[]=0xfe21b0a8df3308c61cb13df57ae5962c567a668a&' + // Ephimera
                'contractAddresses[]=0x495f947276749ce646f68ac8c248420045cb7b5e&' + // OpenSea
                'contractAddresses[]=0xfbeef911dc5821886e1dda71586d90ed28174b7d&' + // KnownOrigin
                // 'contractAddresses[]=0x11bdfb09bebf4f0ab66dd1d6b85d0ef58ef1ba6c&' + // MakersPlace
                // 'contractAddresses[]=0x2d9e5de7d36f3830c010a28b29b3bdf5ca73198e&' + // MakersPlace V2
                // 'contractAddresses[]=0x2a46f2ffd99e19a89476e2f62270e0a35bbf0756&' + // MakersPlace V3
                'contractAddresses[]=0x60f80121c31a0d46b5279700f9df786054aa5ee5&' + // Rarible
                'contractAddresses[]=0x1b8876b57299bef76edf1bec3ce4328a32841643&' + // Kitteh World of Ethereum
                'contractAddresses[]=0x636c03b3929fb010a846b4877449357a4981fb7a&' + // Haiku book
                'contractAddresses[]=0xcae3c92a6d4b6520e00eedeada982261332d9494&' + // Nelly ethEra
                'contractAddresses[]=0x247cd06b0f06f2c15993c3ab9a2347cebd12434f&' + // Nelly F0x
                'contractAddresses[]=0xd1405914eed5c358c9d8ab150f83bf7ffb7939f7&' + // Mrs Ethereum
                'contractAddresses[]=0x1919f156157924389491002127049abd69a808b5&' + // Surrogates
                'contractAddresses[]=0x3725ca6034bcdbc3c9ada649d49df68527661175&' + // 1559
                'contractAddresses[]=0xabEFBc9fD2F806065b4f3C237d4b59D9A97Bcac7' // Zora

let nfts = []
let data = []

let total = 300  // Set the total for the first tower to split the collection
let offset_start = 0
let offset_key = ''
let radius = 24
let per_rotation = 18
let pages = 3
let p = 0
let path = []
let done = false

const sceneMessageBus = new MessageBus()

// const green = new Material()
// green.albedoColor = Color3.Green()
// green.metallic = 0.8
// green.roughness = 0.2

let base_parcel = ''
executeTask(async () => {
  const parcel = await getParcel()
  base_parcel = parcel.land.sceneJsonData.scene.base
  if (base_parcel === '-123,32')
    offset_start = pages
})

// let publicKey = null
// let isInCollection = false
// const publicKeyRequest = executeTask(async () => {
//   publicKey = await getUserPublicKey()
// })

let showNFTs = function() {
  for (let i = 0; i < nfts.length; i++)
    engine.addEntity(nfts[i])
}


// Ground
const ground = new Entity()
ground.addComponent(new Transform({
  position: new Vector3(40, 0, -radius),
  scale: new Vector3(5, 1, 5)
}))
ground.addComponent(new GLTFShape('models/ground.glb'))
engine.addEntity(ground)


// Add fireplaces
let fire = new Entity()
fire.addComponent(new GLTFShape("models/Fireplace.glb"))
fire.addComponent(new Transform({
  position: new Vector3(radius * 2, 0.05, -radius)
}))
engine.addEntity(fire)


// Add music
// const music = new Entity()
// music.addComponent(new Transform({
//   position: new Vector3(radius * 2, 0.1, -radius)
// }))
//
// const source = new AudioStream('https://stream.radio.caktux.ca/radio.mp3')
// music.addComponent(source)
// source.volume = 0.12


// Floating platforms
const platforms = new Entity()
let last_platform = Date.now()
let totalPlatforms = 60
let platform_list = {}
let t = 0

sceneMessageBus.on("new_visitor", (data) => {
  let positions = []
  for (let id in platform_list) {
    let platform = platform_list[id]
    let currentIndex = platform.getComponent(utils.FollowCurvedPathComponent).currentIndex
    positions.push({
      id: id,
      position: platform.getComponent(Transform).position,
      currentIndex: currentIndex
    })
  }
  sceneMessageBus.emit("platforms_share", { positions: positions })
})

sceneMessageBus.on("platforms_share", (data) => {
  let length = data.positions.length
  if (length < 2)
    return
  // log(`Got ${length} shared platforms`)
  if (t < length) {
    for (let i = 0; i < length; i++) {
      let platform = data.positions[i]
      newPlatform(platform.id, true, platform.position, platform.currentIndex)
    }
  }
})

sceneMessageBus.on("platform_new", (data) => {
  if (t >= totalPlatforms ||
      (t > 0 && platform_list[last_platform] && platform_list[last_platform].getComponent(Transform).position.x < 66.5))
    return
  newPlatform(data.id, true, {}, 0)
})

sceneMessageBus.on("platform_paused", (data) => {
  // log(platform_list[data.id].getComponent(Transform).position)
  platform_list[data.id].last_speed = data.speed
  let curve = platform_list[data.id].getComponent(utils.FollowCurvedPathComponent)
  curve.speed[curve.currentIndex] = 0
  platform_list[data.id].getComponent(Transform).position.set(data.position)
  platform_list[data.id].getComponent(Transform).scale.set(3, 0.2, 3)
})

sceneMessageBus.on("platform_unpaused", (data) => {
  let curve = platform_list[data.id].getComponent(utils.FollowCurvedPathComponent)
  platform_list[data.id].getComponent(Transform).scale.set(3, 0.1, 3)
  curve.speed[curve.currentIndex] = platform_list[data.id].last_speed
})

let newPlatform = function(id: number, followPath: boolean, position: Object, index: number) {
  last_platform = id
  let last_speed = 0

  let start_position = path[0]
  if (followPath && position !== {})
    start_position = new Vector3(position['x'], position['y'], position['z'])

  let platform = new Entity()

  platform.addComponent(new CylinderShape())
  platform.addComponent(new Transform({
    scale: new Vector3(3, 0.1, 3),
    position: start_position
  }))

  // if (isInCollection === true && followPath === false)
  //   platform.addComponent(green)

  let followCurve = function() {
    platform.addComponent(new utils.FollowCurvedPathComponent(path, 900, 30, false, true, () => {
      followCurve()
    }))
    if (index !== 0) {
      let curves = []
      curves.push(platform.getComponent(utils.FollowCurvedPathComponent))
      curves[0].currentIndex = index
    }
  }

  // Move along the path and come back
  if (followPath) {
    followCurve()
    platform.addComponent(
      new OnPointerDown((e) => {
        // log(platform.getComponent(utils.FollowCurvedPathComponent))
        let curves = []  // Dirty hack to silence errors about private variables
        curves.push(platform.getComponent(utils.FollowCurvedPathComponent))
        let position = platform.getComponent(Transform).position
        let speed = curves[0].speed[curves[0].currentIndex]
        if (speed !== 0)
          sceneMessageBus.emit("platform_paused", { id: id, speed: speed, position: position })
        else
          sceneMessageBus.emit("platform_unpaused", { id: id })
      },
      { hoverText: "Pause" })
    )
  } else {
    platform.addComponent(
      new OnPointerDown((e) => {
        movePlayerTo({
          x: path[path.length - 1].x,
          y: path[path.length - 1].y,
          z: path[path.length - 1].z
        }, {
          x: path[path.length - 2].x,
          y: path[path.length - 2].y,
          z: path[path.length - 2].z
        })
      },
      { hoverText: "Teleport to top" })
    )
  }

  if (followPath === true)
    platform_list[id] = platform

  engine.addEntity(platform)

  t += 1
}


log("Getting NFTs")
let fetching = false

async function loadNFTs() {
  try {
    if (fetching)
      return
    fetching = true

    let response = await fetch(offset_key ? `${nftsUrl}&pageKey=${offset_key}` : nftsUrl)
    let json = await response.json()

    if (json['pageKey'])
      offset_key = json['pageKey']

    if (offset_start) {
      if (pages === offset_start) {
        pages = Math.ceil(json['totalCount'] / 100)
        log(`Total pages set to ${pages}`)
      }

      if (p < offset_start) {
        fetching = false
        p += 1
        return
      }
    }

    data = json['ownedNfts']
    log(`Got ${data.length} NFTs from a total of ${json['totalCount']} (${p + 1}/${pages})`)

    for (let i = 0; i < data.length; i++) {
      const tokenId = data[i]['contract']['address'] !== '0x495f947276749ce646f68ac8c248420045cb7b5e' ?
                      parseInt(data[i]['id']['tokenId'], 16) : data[i]['id']['tokenId']

      // Skip super pink moon...
      if (data[i]['contract']['address'] === '0xfe21b0a8df3308c61cb13df57ae5962c567a668a' && tokenId === 310) {
        log(`Skipped ${data[i]['contract']['address']}/${tokenId}`)
        continue
      }

      // Set frame color to green for creators
      let color = new Color3(1, 1, 1)
      // if (data[i]['creator'] && data[i]['creator']['address']) {
      //   if (data[i]['creator']['address'] === publicKey) {
      //     if (isInCollection === false)
      //       isInCollection = true
      //     color = new Color3(0.5, 1, 0.5)
      //   }
      // }

      // Set NFT pieces
      let nft_url = `ethereum://${data[i]['contract']['address']}/${tokenId}`
      let entity = new Entity()
      let nft = new NFTShape(nft_url, { color: color })
      entity.addComponent(
        new OnPointerDown((e) => {
          openNFTDialog(nft_url)
        })
      )

      // Set next point
      let point = [radius * Math.sin((per_rotation * i) * (Math.PI / 180)) + radius * 2,
                   (i * Math.PI) / per_rotation + (p - offset_start) * 18.25 + 2.5,
                   radius * Math.cos((per_rotation * i) * (Math.PI / 180)) - radius]

      // Calculate difference for platform path
      let xsign = (point[0] < 0 ) ? -1 : 1
      let zsign = (point[2] > radius) ? -1 : 1
      let xdiff = Math.sin((per_rotation * i) * (Math.PI / 180) * xsign) * 5 * xsign
      let zdiff = Math.cos((per_rotation * i) * (Math.PI / 180) * zsign) * 5 * zsign

      path.push(new Vector3(point[0] - xdiff * xsign,
                            point[1] - 2,
                            point[2] - zdiff * zsign))

      entity.addComponent(
        new Transform({
          position: new Vector3(point[0], point[1], point[2]),
          rotation: Quaternion.Euler(0, i * per_rotation, 0),
          scale: new Vector3(5, 5, 5),
        })
      )
      entity.addComponent(nft)

      nfts.push(entity)
    }
    p += 1

    log(`Loaded page ${p}`)
  } catch {
    error("Failed to fetch NFTs")
  }
  fetching = false
}

const loader = new Entity()
loader.addComponent(
  new utils.Interval(1250, () => {
    if (fetching || done)
      return

    if (p < pages)
      loadNFTs()

    if (p >= pages && !done) {
      done = true

      showNFTs()

      newPlatform(Date.now() - 5000, false, {}, 0)

      sceneMessageBus.emit("new_visitor", {})

      // engine.addEntity(music)
    }
  })
)

platforms.addComponent(
  new utils.Interval(1000, () => {
    if (done && t < totalPlatforms && last_platform + 5000 < Date.now())
      sceneMessageBus.emit("platform_new", {id: Date.now()})
  })
)

// Add platforms and NFTs to engine
engine.addEntity(platforms)
engine.addEntity(loader)
