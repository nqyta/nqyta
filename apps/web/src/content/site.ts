export type RoleOption =
  | 'Terminal User'
  | 'Developer'
  | 'Founder'
  | 'Pixel Artist'
  | 'Designer'
  | 'Web3 Operator'
  | 'Protocol Builder'
  | 'Curious Human';

export type SpriteOption = {
  name: string;
  src: string;
};

export const roleOptions: RoleOption[] = [
  'Terminal User',
  'Developer',
  'Founder',
  'Pixel Artist',
  'Designer',
  'Web3 Operator',
  'Protocol Builder',
  'Curious Human',
];

export const spriteOptions: SpriteOption[] = [
  { name: 'chibi cyborg', src: '/nqita-sprites/candidates/chibi-cyborg.gif' },
  { name: 'simple cyborg', src: '/nqita-sprites/candidates/simple-cyborg.gif' },
  { name: 'cube core', src: '/nqita-sprites/candidates/cube-core.gif' },
  { name: 'armored girl', src: '/nqita-sprites/candidates/armored-girl.gif' },
  { name: 'chibi rotator', src: '/nqita-sprites/candidates/chibi-rotator.gif' },
  { name: 'computer head', src: '/nqita-sprites/candidates/computer-head.gif' },
  { name: 'monitor body', src: '/nqita-sprites/candidates/monitor-body.gif' },
  { name: 'walk cycle', src: '/nqita-sprites/candidates/walk-cycle.gif' },
];
