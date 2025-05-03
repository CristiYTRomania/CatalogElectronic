export { validCNP } from "./cnpValidator";
export { commentPostedTime } from "./time";
export const PhotoLinks = [
  "https://firebasestorage.googleapis.com/v0/b/tudor-jarda-catalog.appspot.com/o/imagini_fundal%2F1.jpg?alt=media&token=82955228-e7f0-4c37-8844-7b89bfc7d057",
  "https://firebasestorage.googleapis.com/v0/b/tudor-jarda-catalog.appspot.com/o/imagini_fundal%2F10.jpg?alt=media&token=756a3987-fb71-47e0-81db-8a597e58efd8",
  "https://firebasestorage.googleapis.com/v0/b/tudor-jarda-catalog.appspot.com/o/imagini_fundal%2F11.jpg?alt=media&token=54f8afc7-5140-47b4-a010-bb506cc557f8",
  "https://firebasestorage.googleapis.com/v0/b/tudor-jarda-catalog.appspot.com/o/imagini_fundal%2F12.jpg?alt=media&token=762a569c-0626-4b24-a084-6093c597afd9",
  "https://firebasestorage.googleapis.com/v0/b/tudor-jarda-catalog.appspot.com/o/imagini_fundal%2F13.jpg?alt=media&token=8fba06e5-00aa-4c1f-ac08-1565ae3451e1",
  "https://firebasestorage.googleapis.com/v0/b/tudor-jarda-catalog.appspot.com/o/imagini_fundal%2F15.jpg?alt=media&token=e8b11b46-63c8-430a-88b4-eb06b9769318",
  "https://firebasestorage.googleapis.com/v0/b/tudor-jarda-catalog.appspot.com/o/imagini_fundal%2F16.jpg?alt=media&token=8fd3701d-171b-4cd1-9611-6525020a03df",
  "https://firebasestorage.googleapis.com/v0/b/tudor-jarda-catalog.appspot.com/o/imagini_fundal%2F17.jpg?alt=media&token=fc161791-3fa8-4e4c-9712-b6d4688b310f",
  "https://firebasestorage.googleapis.com/v0/b/tudor-jarda-catalog.appspot.com/o/imagini_fundal%2F18.jpg?alt=media&token=0d4a142b-16c1-4944-b1af-49f5c42b44d7",
  "https://firebasestorage.googleapis.com/v0/b/tudor-jarda-catalog.appspot.com/o/imagini_fundal%2F1950922.jpg?alt=media&token=03ec9842-566a-4260-a29f-8251091e04c8",
  "https://firebasestorage.googleapis.com/v0/b/tudor-jarda-catalog.appspot.com/o/imagini_fundal%2F2.jpg?alt=media&token=1d003dda-fa12-4971-9ea8-1aed1c9d1bab",
  "https://firebasestorage.googleapis.com/v0/b/tudor-jarda-catalog.appspot.com/o/imagini_fundal%2F3.jpg?alt=media&token=0db5519e-c445-4e41-a450-44cd0ceaa403",
  "https://firebasestorage.googleapis.com/v0/b/tudor-jarda-catalog.appspot.com/o/imagini_fundal%2F4.jpg?alt=media&token=eb00df5a-95f1-48fc-b451-769ec6f3c1db",
  "https://firebasestorage.googleapis.com/v0/b/tudor-jarda-catalog.appspot.com/o/imagini_fundal%2F5.jpg?alt=media&token=77135dd7-4c88-4658-ae14-41ba81d1d44b",
  "https://firebasestorage.googleapis.com/v0/b/tudor-jarda-catalog.appspot.com/o/imagini_fundal%2F6.jpg?alt=media&token=b29aa1b9-29d1-4735-b03b-e1b66dadc94a",
  "https://firebasestorage.googleapis.com/v0/b/tudor-jarda-catalog.appspot.com/o/imagini_fundal%2F7.jpg?alt=media&token=08193c51-34ce-44c2-b7d6-8dec530bd188",
  "https://firebasestorage.googleapis.com/v0/b/tudor-jarda-catalog.appspot.com/o/imagini_fundal%2F8.jpg?alt=media&token=cf73fe14-2f7a-400c-9d68-7b53f6a4c636",
  "https://firebasestorage.googleapis.com/v0/b/tudor-jarda-catalog.appspot.com/o/imagini_fundal%2F9.jpg?alt=media&token=ca0a72f4-9720-4b38-9d17-287a963f6843",
];
export const RetriveImageUrl = (nr) => {
  return PhotoLinks[nr % PhotoLinks.length];
};

export const getMaterieColor = (index) => {
  let array = [
    "#681488",
    "#0EA44F",
    "#5B84B1FF",
    "#00203FFF",
    "#d72631",
    "#077b8a",
    "#5c3c92",
    "#1e3d59",
    "#ff6e40",
    "#ffc13b",
    "#F67280",
    "#C06C84",
    "#6C5B7B",
    "#355C7D",
    "#2A363B",
    "#E8175D",
  ];
  return array[index % array.length];
};
export function blobToFile(theBlob, fileName) {
  //A Blob() is almost a File() - it's just missing the two properties below which we will add
  theBlob.lastModifiedDate = new Date();
  theBlob.name = fileName;
  return theBlob;
}

export const anonymus =
  "https://firebasestorage.googleapis.com/v0/b/catalog-cce7f.appspot.com/o/application_utils%2Fprofile-elev.webp?alt=media&token=317e151e-911a-402e-95a6-533d88117baf";
export const formatDate = (today) => {
  const yyyy = today.getFullYear();
  let mm = today.getMonth() + 1; // Months start at 0!
  let dd = today.getDate();

  if (dd < 10) dd = "0" + dd;
  if (mm < 10) mm = "0" + mm;

  return dd + "." + mm;
};

export const renderClassName = (clas) => {
  if (clas === undefined) return " -transferat- ";
  return clas?.anClasa === "Pregătitoare" || clas?.anClasa === "I"
    ? clas?.anClasa + " " + clas?.identificator
    : "a " +
        clas?.anClasa +
        "-a" +
        (clas?.identificator.length > 0 && clas.identificator !== " "
          ? " " + clas?.identificator
          : "");
};
