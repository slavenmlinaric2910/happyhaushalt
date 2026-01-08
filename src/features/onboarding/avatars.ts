export type AvatarId =
  | "broom-buddy"
  | "sponge-pal"
  | "vacuum-vroom"
  | "plant-pot-friend"
  | "pc-gremlin"
  | "frying-pan-pal"
  | "keychain-keeper"
  | "light-bulb-buddy"
  | "trash-can-champ"
  | "toasty-buddy";

export interface Avatar {
  id: AvatarId;
  label: string;
  src: string;
}

export const AVATARS: Avatar[] = [
  { id: "broom-buddy", label: "Broom Buddy", src: "/avatars/broom-buddy.png" },
  { id: "sponge-pal", label: "Sponge Pal", src: "/avatars/sponge-pal.png" },
  { id: "vacuum-vroom", label: "Vacuum Vroom", src: "/avatars/vacuum-vroom.png" },
  { id: "plant-pot-friend", label: "Plant Pot Friend", src: "/avatars/plant-pot-friend.png" },
  { id: "pc-gremlin", label: "PC Gremlin", src: "/avatars/pc-gremlin.png" },
  { id: "frying-pan-pal", label: "Frying Pan Pal", src: "/avatars/frying-pan-pal.png" },
  { id: "keychain-keeper", label: "Keychain Keeper", src: "/avatars/keychain-keeper.png" },
  { id: "light-bulb-buddy", label: "Light Bulb Buddy", src: "/avatars/light-bulb-buddy.png" },
  { id: "trash-can-champ", label: "Trash Can Champ", src: "/avatars/trash-can-champ.png" },
  { id: "toasty-buddy", label: "Toasty Buddy", src: "/avatars/toasty-buddy.png" },
];

