import React, { useMemo, useRef } from 'react'
import { pages } from './UI'
import { Bone, BoxGeometry, Color, Float32BufferAttribute, MeshStandardMaterial, Skeleton, SkeletonHelper, SkinnedMesh, SRGBColorSpace, Uint16BufferAttribute, Vector3 } from 'three';
import { useHelper, useTexture } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { degToRad } from 'three/src/math/MathUtils.js';

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

const whiteColor = new Color("white")

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
];

pages.forEach((page) => {
  useTexture.preload(`/textures/${page.front}.jpg`);
  useTexture.preload(`/textures/${page.back}.jpg`);
  useTexture.preload(`/textures/book-cover-roughnwss.jpg`);
})

function Page({number, front, back, ...props}) {

  const [picture, picture2, pictureRoughness] = useTexture([
    `/textures/${front}.jpg`,
    `/textures/${back}.jpg`,
    ...(number === 0 || number === pages.length -1 ? 
      [`textures/book-cover-roughnwss.jpg`]
      : []),
  ])

  picture.colorSpace = picture2.colorSpace = SRGBColorSpace;
  
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
        bone(i - 1).add(bone)
      }
    }
    const skeleton = new Skeleton(bones);
    const materials = [...pageMaterials, 
      new MeshStandardMaterial({
        color: whiteColor,
        map: picture,
        ...(number === 0 ? {
          roughnessMap: pictureRoughness,
        } : {
          roughness: 0.1,
        }),
      }),
      new MeshStandardMaterial({
        color: whiteColor,
        map: picture2,
        ...(number === pages.length - 1 ? {
          roughnessMap: pictureRoughness,
        } : {
          roughness: 0.1,
        }), 
      })
    ];
    const mesh = new SkinnedMesh(pageGeometry, materials);
    mesh.castShadow = true;
    mesh.receiveShadow = false;
    mesh.add(skeleton.bones[0]);
    mesh.bind(skeleton);
    return mesh;
  }, [])

  useHelper(skinnedMeshRef, SkeletonHelper, "red");

  useFrame(() => {

    if(!skinnedMeshRef.current) {
      return;
    }

    const bones = skinnedMeshRef.current.skeleton.bones;

    bones[2].rotation.y = degToRad(40);
    bones[2].position.x = degToRad(10);
    bones[2].position.y = degToRad(-50);
  })

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

export default Book;