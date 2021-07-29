
// Custom component for smoke puffs
@Component('smokevelocity')
export class SmokeVelocity extends Vector3 {
  constructor(x: number, y: number, z: number) {
    super(x, y, z)
  }
}


// Component group listing all smoke puffs
export const smokePuffs = engine.getComponentGroup(SmokeVelocity)

// System to update the position of all smoke puffs based on their velocity
export class SmokeSystem implements ISystem {
  update(dt: number) {

    for (let entity of smokePuffs.entities) {
      const transform = entity.getComponent(Transform)
      const velocity = entity.getComponent(SmokeVelocity)

      transform.position.x += velocity.x * dt
      transform.position.y += velocity.y * dt
      transform.position.z += velocity.z * dt

      let newScale = transform.scale.x * 1.0025

      transform.scale.setAll(newScale)

      velocity.x *= 0.995
      velocity.z *= 0.995

      if (isOutOfBounds(transform)) {
        engine.removeEntity(entity)
      }
    }
  }
}

// Function to check if smoke is too far from source
function isOutOfBounds(transform: Transform) {
  if (
    transform.position.y > 4 ||
    transform.position.x > 1.5 ||
    transform.position.z > 1.5 ||
    transform.position.x < -1.5 ||
    transform.position.z < -1.5
  ) {
    return true
  }
  return false
}
