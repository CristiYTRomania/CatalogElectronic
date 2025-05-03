import { updateDoc, doc, getDoc, setDoc, deleteDoc } from "firebase/firestore";
import { db, storage } from "./firebase";
import { openErrorNotification } from "../Components/Notifications/errorNotification";
import { getFunctions, httpsCallable } from "firebase/functions";
import { openSuccesNotification } from "../Components/Notifications/succesNotification";
import { auth } from "./firebase";
import {
  ref,
  uploadBytes,
  getDownloadURL,
  getMetadata,
  deleteObject,
  listAll,
} from "firebase/storage";
import Promise from "bluebird";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import {
  RecaptchaVerifier,
  multiFactor,
  PhoneAuthProvider,
  PhoneMultiFactorGenerator,
  getMultiFactorResolver,
  MultiFactorSession,
  MultiFactorInfo,
  MultiFactorResolver,
  PhoneInfoOptions,
} from "firebase/auth";

// Used in multi-factor enrollment.
let verificationId = null;
let multiFactorResolver = null;
export const getMfaResolver = (error, auth) => {
  multiFactorResolver = getMultiFactorResolver(auth, error);
  return multiFactorResolver;
};

// Used in multi-factor enrollment.

export const startMfaSignin = async (
  multiFactorHint,
  session,
  auth,
  setIntroduCode
) => {
  let recaptchaVerifier;

  try {
    recaptchaVerifier = new RecaptchaVerifier(auth, "login-btn", {
      size: "invisible",
      callback: async (response) => {
        await proceedWithPhoneNumberVerification(
          multiFactorHint,
          session,
          auth,
          recaptchaVerifier
        );

        setIntroduCode(true);
      },
      "expired-callback": () => {
        console.error("reCAPTCHA expired. Re-initializing...");
        openErrorNotification("reCAPTCHA expired. Please try again.");
      },
      "error-callback": (error) => {
        console.error("reCAPTCHA error:", error);
        openErrorNotification("Error with reCAPTCHA. Please try again.");
      },
    });

    await recaptchaVerifier.render();
  } catch (error) {
    console.error("Failed to initialize reCAPTCHA:", error);
    // openErrorNotification("Failed to initialize reCAPTCHA.");
    return;
  }
};

const proceedWithPhoneNumberVerification = async (
  multiFactorHint,
  session,
  auth,
  recaptchaVerifier
) => {
  const phoneAuthProvider = new PhoneAuthProvider(auth);
  const phoneInfoOptions = {
    multiFactorHint: multiFactorHint,
    session: session,
  };

  try {
    verificationId = await phoneAuthProvider.verifyPhoneNumber(
      phoneInfoOptions,
      recaptchaVerifier
    );
  } catch (error) {
    console.error("Error verifying phone number:", error);
    openErrorNotification("Error verifying phone number.");
    auth.signOut();
  }
};

export const finishMfaSignIn = async (verificationCode, auth) => {
  if (verificationId && multiFactorResolver) {
    const cred = PhoneAuthProvider.credential(verificationId, verificationCode);
    const multiFactorAssertion = PhoneMultiFactorGenerator.assertion(cred);

    try {
      await multiFactorResolver.resolveSignIn(multiFactorAssertion);
      console.log("User successfully signed in with the second factor.");
    } catch (error) {
      console.error("Error completing sign-in:", error);
      openErrorNotification("Error completing sign-in.");
      throw error;
    }
  }

  multiFactorResolver = null;
  verificationId = null;
};

export const startEnrollMultiFactor = async (
  phoneNumber,
  auth,
  setActiveSms
) => {
  let recaptchaVerifier;

  try {
    recaptchaVerifier = new RecaptchaVerifier(auth, "login-btn", {
      size: "invisible",
      callback: async (response) => {
        console.log("reCAPTCHA solved:", response);
        console.log("reCAPTCHA solved:", response);

        await proceedWithMultiFactorEnrollment(
          phoneNumber,
          auth,
          recaptchaVerifier
        ).then(() => {
          setActiveSms(true);
        });
      },
      "expired-callback": () => {
        console.error("reCAPTCHA expired. Re-initializing...");
        openErrorNotification("reCAPTCHA expired. Please try again.");
      },
      "error-callback": (error) => {
        console.error("reCAPTCHA error:", error);
        openErrorNotification("Error with reCAPTCHA. Please try again.");
      },
    });

    await recaptchaVerifier.render();
    console.log("reCAPTCHA rendered successfully.");
  } catch (error) {
    console.error("Failed to initialize reCAPTCHA:", error);
    // openErrorNotification("Failed to initialize reCAPTCHA.");
    return;
  }
};

const proceedWithMultiFactorEnrollment = async (
  phoneNumber,
  auth,
  recaptchaVerifier
) => {
  if (auth.currentUser) {
    try {
      const multiFactorSession = await multiFactor(
        auth.currentUser
      ).getSession();
      console.log(phoneNumber);
      const phoneInfoOptions = {
        phoneNumber: phoneNumber,
        session: multiFactorSession,
      };
      const phoneAuthProvider = new PhoneAuthProvider(auth);

      verificationId = await phoneAuthProvider.verifyPhoneNumber(
        phoneInfoOptions,
        recaptchaVerifier
      );
      console.log("Verification ID for enrollment:", verificationId);
    } catch (error) {
      console.error("Error during multi-factor enrollment:", error);
      openErrorNotification("Error during multi-factor enrollment.");
    }
  } else {
    openErrorNotification("User is not authenticated.");
  }
};

export const finishEnrollMultiFactor = async (verificationCode, auth) => {
  if (verificationId && auth.currentUser) {
    // Ask user for the verification code. Then:
    const cred = PhoneAuthProvider.credential(verificationId, verificationCode);
    const multiFactorAssertion = PhoneMultiFactorGenerator.assertion(cred);
    console.log(cred, multiFactorAssertion);
    // Complete enrollment.
    await multiFactor(auth.currentUser)
      .enroll(multiFactorAssertion, "My cellphone number")
      .catch(function (error) {
        console.log(error);
        alert(`Error finishing second factor enrollment. ${error}`);
        throw error;
      });
    verificationId = null;
  }
};
export const uploadFile = () => {};

export const updateDocDatabase = async (
  collection,
  documentName,
  dataToUpdate
) => {
  try {
    const document = doc(db, collection, documentName);
    const docSnap = await getDoc(document);

    if (docSnap.exists()) {
      await updateDoc(document, { ...dataToUpdate });
    } else {
      await setDoc(document, { ...dataToUpdate });
    }
  } catch (err) {
    openErrorNotification(err);
  }
};

export const getDataDoc = (collection, documentName) =>
  new Promise(async (resolve) => {
    try {
      const document = doc(db, collection, documentName);
      let snap = await getDoc(document);
      if (snap) {
        let dataSnap = snap.data();

        resolve(dataSnap);
      }
    } catch (err) {
      openErrorNotification(err);
      resolve(undefined);
    }
  });

export const uploadFileDatabse = async (files, collection) => {
  return new Promise(async (resolve, reject) => {
    let newArray = [];
    for (let file of files) {
      const storageRef = ref(storage, collection + "/" + file.name);
      await uploadBytes(storageRef, file)
        .then((snapshot) => {
          return getDownloadURL(snapshot.ref);
        })
        .then((dowloadURL) => {
          newArray.push(dowloadURL);
        });
    }
    resolve(newArray);
  });
};

export const deleteDataDoc = async (collection, documentName) => {
  try {
    const document = doc(db, collection, documentName);

    await deleteDoc(document);
  } catch (err) {
    openErrorNotification(err);
    return undefined;
  }
};

const download = (url) => {
  return fetch(url).then((resp) => resp.blob());
};

const downloadByGroup = (urls, files_per_group = 5) => {
  return Promise.map(
    urls,
    async (url) => {
      return await download(url);
    },
    { concurrency: files_per_group }
  );
};

export const downloadFolderAsZip = async (collection, titleOf = "catalog") => {
  console.log(collection);
  const jszip = new JSZip();
  const folderRef = ref(storage, collection);
  const folder = await listAll(folderRef);
  const promises = folder.items
    .map(async (item) => {
      const file = await getMetadata(item);
      const fileRef = ref(storage, item.fullPath);
      const fileBlob = await getDownloadURL(fileRef).then((url) => {
        return fetch(url).then((response) => response.blob());
      });

      jszip.file(file.name, fileBlob);
    })
    .reduce((acc, curr) => acc.then(() => curr), Promise.resolve());
  await promises;
  const blob = await jszip.generateAsync({ type: "blob" });
  saveAs(blob, `${titleOf}.zip`);
};
export const changeUserPasswordDatabase = async (targetUserId, newPassword) => {
  try {
    const user = auth.currentUser;
    if (!user) {
      throw new Error("User is not authenticated");
    }

    const token = await user.getIdToken(); // Obține token-ul Firebase

    const functions = getFunctions();

    const changePasswordFunc = httpsCallable(functions, "changeUserPassword");

    const response = await changePasswordFunc({
      targetUserId,
      newPassword,
    });

    if (!response.data.success) {
      throw new Error("Failed to change password: " + response.data.message);
    }

    openSuccesNotification("Password changed successfully:", response.data);
  } catch (err) {
    console.error("Error changing password:", err);
    openErrorNotification(
      err.message || "An error occurred while changing the password."
    );
  }
};
