import React, { useMemo, useRef } from 'react'
import { pages } from './UI'
import { Bone, BoxGeometry, Color, Float32BufferAttribute, MeshStandardMaterial, Skeleton, SkinnedMesh, Uint16BufferAttribute, Vector3 } from 'three';

const PAGE_WIDTH = 12.8;
const PAGE_HEIGHT = 17.1;
const PAGE_DEPTH = 0.003;
const PAGE_SEGMENTS =  30;
const SEGMENT_WIDTH = PAGE_WIDTH / PAGE_SEGMENTS;

const pageGeometry = new BoxGeometry(
  PAGE_WIDTH, 
  PAGE_HEIGHT,
  PAGE_DEPTH,
  PAGE_SEGMENTS,
  2,
)

pageGeometry.translate(PAGE_WIDTH / 2, 0, 0);

const position = pageGeometry.attributes.position;
const vertex = new Vector3();
const skinIndexes = [];
const skinWeights = [];

for(let i = 0; i < position.count; i++) {
  vertex.fromBufferAttribute(position, i);
  const x = vertex.x;
  const skinIndex = Math.max(0, Math.floor(x / SEGMENT_WIDTH));
  let skinWeight = (x % SEGMENT_WIDTH) / SEGMENT_WIDTH;

  skinIndexes.push(skinIndex, skinIndex + 1, 0, 0);
  skinWeights.push(1 - skinWeight, skinWeight, 0, 0);
}

pageGeometry.setAttribute(
  "skinIndex",
  new Uint16BufferAttribute(skinIndexes, 4)
);

pageGeometry.setAttribute(
  "skinWeight",
  new Float32BufferAttribute(skinWeights, 4)
);

const whiteColor = new Color("white");

const pageMaterials = [
  new MeshStandardMaterial({
    color: whiteColor,
  }),
  new MeshStandardMaterial({
    color: "#111",
  }),
  new MeshStandardMaterial({
    color: whiteColor,
  }),
  new MeshStandardMaterial({
    color: whiteColor,
  }),
  new MeshStandardMaterial({
    color: "pink",
  }),
  new MeshStandardMaterial({
    color: "blue",
  }),
];

function Page({number, front, back, ...props}) {
  
  const group = useRef()

  const skinnedMeshRef = useRef();

  const manualSkinnedMesh = useMemo(() => {
    const bones = [];
    for (let i = 0; i <= PAGE_SEGMENTS; i++) {
      let bone = new Bone();
      bones.push(bone);
      if(i === 0) {
        bone.position.x = 0;
      } else {
        bone.position.x = SEGMENT_WIDTH;
      }
      if(i > 0) {
        bone(i - 1).add(bone);
      }
    }
    const skeleton = new Skeleton(bones);
    const materials = pageMaterials;
    const mesh = new SkinnedMesh(pageGeometry, materials);
    mesh.castShadow = true;
    mesh.receiveShadow = false;
    mesh.add(skeleton.bones[0]);
    mesh.bind(skeleton);
    return mesh;
  }, [])

  return (
    <group {...props} ref={group}>
      <primitive object={manualSkinnedMesh} ref={skinnedMeshRef}/>
    </group>
  )
}

function Book({...props}) {
  return (
    <group {...props}>
      {
        [...pages].map((pageData, index) => index === 0 ? (
          <Page position-x={index * 0.15} key={index} number={index} {...pageData}/>
        ) : null)
      }
    </group>
  )
}

export default Book