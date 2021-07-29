import utils from "../node_modules/decentraland-ecs-utils/index"
import { SmokeSource, ThrowSmoke } from "./modules/smokeSource";
import { SmokeSystem } from "./modules/smoke";

const nftsUrl = 'https://api.opensea.io/api/v1/assets?' +
                'owner=0x378BCce7235D53BBc3774BFf8559191F06E6818E&' +
                'asset_contract_addresses=0x3b3ee1931dc30c1957379fac9aba94d1c48a5405&' + // Foundation
                'asset_contract_addresses=0xb932a70a57673d89f4acffbe830e8ed7f75fb9e0&' + // SuperRare
                'asset_contract_addresses=0xfe21b0a8df3308c61cb13df57ae5962c567a668a&' + // Ephimera
                'asset_contract_addresses=0x495f947276749ce646f68ac8c248420045cb7b5e&' + // OpenSea
                'asset_contract_addresses=0xdde2d979e8d39bb8416eafcfc1758f3cab2c9c72&' + // KnownOrigin V1
                'asset_contract_addresses=0xfbeef911dc5821886e1dda71586d90ed28174b7d&' + // KnownOrigin
                'asset_contract_addresses=0x11bdfb09bebf4f0ab66dd1d6b85d0ef58ef1ba6c&' + // MakersPlace
                'asset_contract_addresses=0x2d9e5de7d36f3830c010a28b29b3bdf5ca73198e&' + // MakersPlace V2
                'asset_contract_addresses=0x2a46f2ffd99e19a89476e2f62270e0a35bbf0756&' + // MakersPlace V3
                'asset_contract_addresses=0x6a5ff3ceecae9ceb96e6ac6c76b82af8b39f0eb3&' + // Rarible V1
                'asset_contract_addresses=0x60f80121c31a0d46b5279700f9df786054aa5ee5&' + // Rarible
                'asset_contract_addresses=0x1b8876b57299bef76edf1bec3ce4328a32841643&' + // Kitteh World of Ethereum
                'asset_contract_addresses=0x636c03b3929fb010a846b4877449357a4981fb7a&' + // Haiku book
                'asset_contract_addresses=0xcae3c92a6d4b6520e00eedeada982261332d9494&' + // Nelly ethEra
                'asset_contract_addresses=0x247cd06b0f06f2c15993c3ab9a2347cebd12434f&' + // Nelly F0x
                'asset_contract_addresses=0xd1405914eed5c358c9d8ab150f83bf7ffb7939f7&' + // Mrs Ethereum
                'asset_contract_addresses=0x1919f156157924389491002127049abd69a808b5&' + // Surrogates
                'asset_contract_addresses=0x3725ca6034bcdbc3c9ada649d49df68527661175&' + // 1559
                'order_by="sale_date"&order_direction="desc"&'

let nfts = []
let data = []

let offset = 0
let split = 20
let total = 800
let per_rotation = 360 / (split * Math.PI)
let pages = total / split
let p = -1
let path = []
let done = false

let showNFTs = function() {
  for (let i = 0; i < nfts.length; i++) {
    engine.addEntity(nfts[i])
  }
}

log("Getting NFTs")
async function loadNFTs() {
  try {
    p = p + 1

    let response = await fetch(nftsUrl + `limit=${split}&offset=${offset}`)
    let json = await response.json()

    data = json['assets']
    log(`Got ${data.length} NFTs`)

    if (data.length === 0) {
      log('No more NFTs to load')
      done = true
      showNFTs()
      return
    }

    for (let i = 0; i < data.length; i++) {
      let nft_url = `ethereum://${data[i]['asset_contract']['address']}/${data[i]['token_id']}`
      let entity = new Entity()
      let nft = new NFTShape(
        nft_url,
        { color: new Color3(1, 1, 1) }
      )
      entity.addComponent(
        new OnPointerDown((e) => {
          openNFTDialog(nft_url)
        })
      )

      let point = [Math.cos(i * per_rotation) * split * 1.25 + split * 2 + 7,
                   (i * per_rotation) / 25 + p * 4.5 + 2.5,
                   Math.sin(i * per_rotation) * split * 1.25 - split - 5]

      let xsign = (point[0] > 42) ? -1 : 1
      let zsign = (point[2] > 35) ? -1 : 1
      let xdiff = Math.cos(i * per_rotation * xsign) * 3 * xsign
      let zdiff = Math.sin(i * per_rotation * zsign) * 3 * zsign
      path.push(new Vector3(point[0] - xdiff * xsign, point[1] - 2, point[2] - zdiff * zsign))

      entity.addComponent(
        new Transform({
          position: new Vector3(point[0], point[1], point[2]),
          rotation: Quaternion.Euler(0, i * per_rotation * 5.5 + 90, 0),
          scale: new Vector3(5, 5, 5),
        })
      )
      entity.addComponent(nft)
      // entity.addComponent(new Billboard())

      nfts.push(entity)
    }
    offset = offset + split

    log(`Loaded page ${p + 1}`)

    if (p === pages)
      showNFTs()
  } catch {
    error("Failed to fetch NFTs")
  }
}

const loader = new Entity()
loader.addComponent(
  new utils.Interval(1000, () => {
    if (p < pages && done !== true)
      loadNFTs()
  })
)

// Floating platforms
const platforms = new Entity()
let totalPlatforms = 90
let t = 0
platforms.addComponent(
  new utils.Interval(20000, () => {
    if (t >= totalPlatforms) {
      return
    }

    let box = new Entity()

    // Give entity a shape and transform
    box.addComponent(new BoxShape())
    box.addComponent(new Transform({
      scale: new Vector3(3, 0.1, 3),
      position: path[0],  // new Vector3(75, 0.5, -20),
      rotation: Quaternion.Euler(0, 45, 0)
    }))

    // Rotate entity
    // box.addComponent(new utils.KeepRotatingComponent(Quaternion.Euler(0, 5.5, 0)))
    // Move along the path
    box.addComponent(new utils.FollowCurvedPathComponent(path, 1800, 60, true, true))

    engine.addEntity(box)
    t = t + 1
  })
)

// Add platforms and NFTs to engine
engine.addEntity(platforms)
engine.addEntity(loader)

// add fireplace
let fire = new Entity()
fire.addComponent(new GLTFShape("models/Fireplace.glb"))
fire.addComponent(new Transform({
  position: new Vector3(48, 0.1, -24)
}))

// Add a smoke source that creates a smoke puff every 0.2 seconds
fire.addComponent(new SmokeSource(0.2))
engine.addEntity(fire)

// ground
let floor = new Entity()
floor.addComponent(new GLTFShape("models/FloorBaseGrass.glb"))
floor.addComponent(new Transform({
  position: new Vector3(48, 0, -24),
  scale:new Vector3(9.5, 0.1, 7.8)
}))
engine.addEntity(floor)

// Initiate systems
engine.addSystem(new ThrowSmoke())
engine.addSystem(new SmokeSystem())

// Create music
const music = new Entity()
music.addComponent(new Transform({
  position: new Vector3(48, 0.1, -24)
}))

// Create AudioClip object, holding audio file
const clip = new AudioClip("sounds/KidKoala-FenderBender.mp3")

// Create AudioSource component, referencing `clip`
const source = new AudioSource(clip)

// Add AudioSource component to entity
music.addComponent(source)

// Play sound
source.loop = true
source.volume = 1
source.playing = true

engine.addEntity(music)
