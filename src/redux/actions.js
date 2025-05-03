import { db } from "../database/firebase";
import { getDataDoc } from "../database/";
import { getDocs, collection, getDoc, doc } from "firebase/firestore";
import { createAction, createAsyncThunk } from "@reduxjs/toolkit";
export const getClase = createAsyncThunk("GET_CLASE_ASYNC", async () => {
  const querySnapshot = await getDoc(doc(db, "clase", "clase"));

  let array = querySnapshot.data()?.clase || [];

  return {
    payload: {
      array,
    },
  };
});

export const getAni = createAsyncThunk("GET_Ani_ASYNC", async () => {
  const querySnapshot = await getDoc(doc(db, "ani", "ani"));

  let array = querySnapshot.data()?.ani || [];

  return {
    payload: {
      array,
    },
  };
});

export const getMaterii = createAsyncThunk("GET_MATERII", async () => {
  const querySnapshot = await getDocs(collection(db, "materii"));

  let array = [];
  querySnapshot.forEach((doc) => {
    // doc.data() is never undefined for query doc snapshots

    array.push({
      ...doc.data(),
      text: doc.data().numeMaterie,
      value: doc.id,
    });
  });

  return {
    payload: {
      array,
    },
  };
});

export const getProfesori = createAsyncThunk("GET_PROFESORI", async () => {
  const querySnapshot = await getDocs(collection(db, "profesori"));

  const array = await Promise.all(
    querySnapshot.docs.map(async (profDoc) => {
      const profData = profDoc.data();

      return {
        ...profData,
        text: profData.prenume + " " + profData.numeDeFamilie,
        id: profDoc.id,
      };
    })
  );

  return {
    payload: {
      array,
    },
  };
});
export const getSettigs = createAsyncThunk("GET_SETTINGS", async () => {
  const settings = await getDataDoc("settings", "settings");

  return {
    payload: {
      settings,
    },
  };
});

export const getAnunturi = createAsyncThunk("GET_ANUNTURI", async () => {
  const querySnapshot = await getDocs(collection(db, "anunturi"));

  let array = [];
  querySnapshot.forEach((doc) => {
    // doc.data() is never undefined for query doc snapshots

    array.push({
      ...doc.data().anunt,

      id: doc.id,
    });
  });

  return {
    payload: {
      array,
    },
  };
});
