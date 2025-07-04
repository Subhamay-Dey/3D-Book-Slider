import React, { useMemo, useRef } from 'react'
import { pageAtom, pages } from './UI'
import { Bone, BoxGeometry, Color, Float32BufferAttribute, MeshStandardMaterial, Skeleton, SkeletonHelper, SkinnedMesh, SRGBColorSpace, Uint16BufferAttribute, Vector3 } from 'three';
import { useHelper, useTexture } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { degToRad } from 'three/src/math/MathUtils.js';
import { useAtom } from 'jotai';

const PAGE_WIDTH = 1.28;
const PAGE_HEIGHT = 1.71;
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
  useTexture.preload(`/textures/book-cover-roughness.jpg`);
})

function Page({number, front, back, page, ...props}) {

  const [picture, picture2, pictureRoughness] = useTexture([
    `/textures/${front}.jpg`,
    `/textures/${back}.jpg`,
    ...(number === 0 || number === pages.length -1 ? 
      [`textures/book-cover-roughness.jpg`]
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
      // if(i > 0) {
      //   bones(i - 1).add(bone);
      // }
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
    mesh.receiveShadow = true;
    mesh.frustumCulled = false;
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
  })

  return (
    <group {...props} ref={group}>
      <primitive 
        object={manualSkinnedMesh} 
        ref={skinnedMeshRef}
        position-z={-number * PAGE_DEPTH + page * PAGE_DEPTH}
      />
    </group>
  )
}

function Book({...props}) {

  const [page] = useAtom(pageAtom);

  return (
    <group {...props}>
      {
        [...pages].map((pageData, index) => index === 0 ? (
          <Page key={index} page={page} number={index} {...pageData}/>) : null
        )
      }
    </group>
  )
}

export default Book;