import type { ImageSourcePropType } from 'react-native';

const pictures: Record<string, ImageSourcePropType> = {
  arjun: require('../../assets/profile-pictures/arjun.jpg'),
  rajiv: require('../../assets/profile-pictures/rajiv.jpg'),
  neha: require('../../assets/profile-pictures/neha.jpg'),
  savita: require('../../assets/profile-pictures/savita.jpg'),
  'rhea-malhotra': require('../../assets/profile-pictures/rhea-malhotra.jpg'),
  'maya-iyer': require('../../assets/profile-pictures/maya-iyer.jpg'),
  'emily-chen': require('../../assets/profile-pictures/emily-chen.jpg'),
  'aditi-rao': require('../../assets/profile-pictures/aditi-rao.jpg'),
  'sameer-khanna': require('../../assets/profile-pictures/sameer-khanna.jpg'),
  'kabir-sethi': require('../../assets/profile-pictures/kabir-sethi.jpg'),
  'meera-bhasin': require('../../assets/profile-pictures/meera-bhasin.jpg'),
  'liam-walker': require('../../assets/profile-pictures/liam-walker.jpg'),
  'devika-shah': require('../../assets/profile-pictures/devika-shah.jpg'),
  'rohan-gill': require('../../assets/profile-pictures/rohan-gill.jpg'),
  'ananya-sen': require('../../assets/profile-pictures/ananya-sen.jpg'),
  'kavita-joshi': require('../../assets/profile-pictures/kavita-joshi.jpg'),
  'pranav-kulkarni': require('../../assets/profile-pictures/pranav-kulkarni.jpg'),
  'sophie-hart': require('../../assets/profile-pictures/sophie-hart.jpg'),
  'naina-kapoor': require('../../assets/profile-pictures/naina-kapoor.jpg'),
  'isha-verma': require('../../assets/profile-pictures/isha-verma.jpg'),
  'daniel-lee': require('../../assets/profile-pictures/daniel-lee.jpg'),
  'zoya-mirza': require('../../assets/profile-pictures/zoya-mirza.jpg'),
  'arvind-nair': require('../../assets/profile-pictures/arvind-nair.jpg'),
  'claire-wong': require('../../assets/profile-pictures/claire-wong.jpg'),
  'harsh-vardhan': require('../../assets/profile-pictures/harsh-vardhan.jpg'),
  'ritu-chawla': require('../../assets/profile-pictures/ritu-chawla.jpg'),
  'tara-menon': require('../../assets/profile-pictures/tara-menon.jpg'),
  'olivia-reed': require('../../assets/profile-pictures/olivia-reed.jpg'),
  'mohit-arora': require('../../assets/profile-pictures/mohit-arora.jpg'),
  'sana-qureshi': require('../../assets/profile-pictures/sana-qureshi.jpg'),
  'farah-ali': require('../../assets/profile-pictures/farah-ali.jpg'),
  'pooja-saini': require('../../assets/profile-pictures/pooja-saini.jpg'),
  'sunil-yadav': require('../../assets/profile-pictures/sunil-yadav.jpg'),
  'grace-thomas': require('../../assets/profile-pictures/grace-thomas.jpg'),
  'rekha-paul': require('../../assets/profile-pictures/rekha-paul.jpg'),
  'amanpreet-kaur': require('../../assets/profile-pictures/amanpreet-kaur.jpg'),
  'julia-martin': require('../../assets/profile-pictures/julia-martin.jpg'),
  'shreya-bose': require('../../assets/profile-pictures/shreya-bose.jpg'),
  'alok-mathur': require('../../assets/profile-pictures/alok-mathur.jpg'),
  'leela-dsouza': require('../../assets/profile-pictures/leela-dsouza.jpg'),
};

const familyAliases: Record<string, string> = {
  'arjun-mehra': 'arjun',
  'rajiv-mehra': 'rajiv',
  'neha-mehra': 'neha',
  'savita-mehra': 'savita',
};

const fallbackPictures = Object.values(pictures);

function slugify(value: string) {
  return value
    .normalize('NFKD')
    .toLowerCase()
    .replace(/[’']/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function pictureKey(person: string) {
  const slug = slugify(person);
  return familyAliases[slug] ?? slug;
}

export function hasProfilePictureFor(person: string) {
  return Boolean(pictures[pictureKey(person)]);
}

/** Returns a stable local portrait for a named human, including generic reviewers. */
export function profilePictureFor(person: string): ImageSourcePropType {
  const slug = slugify(person);
  const key = pictureKey(person);
  const exact = pictures[key];
  if (exact) return exact;

  const hash = [...slug].reduce((total, character) => total + character.charCodeAt(0), 0);
  return fallbackPictures[hash % fallbackPictures.length]!;
}
