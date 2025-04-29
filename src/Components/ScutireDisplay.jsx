import React, { useState, useEffect } from "react";
import { storage } from "../database/firebase";
import { ref, listAll, getDownloadURL } from "firebase/storage";
import JSZip from "jszip";
import { saveAs } from "file-saver";

const ImageDisplay = ({ folderNames, elevName }) => {
  const [fileData, setFileData] = useState([]);

  useEffect(() => {
    const fetchFiles = async () => {
      let allFileData = [];
      if (!folderNames?.length) return;
      for (const folderName of folderNames) {
        const folderRef = ref(storage, folderName);
        try {
          const res = await listAll(folderRef);
          const urls = await Promise.all(
            res.items.map((itemRef) =>
              getDownloadURL(itemRef).then((url) => ({
                url,
                name: itemRef.name,
                folderName,
              }))
            )
          );
          allFileData.push(...urls);
        } catch (error) {
          console.error("Error listing files from", folderName, error);
        }
      }
      setFileData(allFileData);
    };

    fetchFiles();
  }, [folderNames]);

  const downloadAllFiles = () => {
    const zip = new JSZip();

    fileData.forEach((file) => {
      // Fetch each file and add to the ZIP
      fetch(file.url)
        .then((response) => response.blob())
        .then((blob) => {
          zip.file(`${file.name}`, blob); // Organize files by folder in the ZIP
          if (fileData.indexOf(file) === fileData.length - 1) {
            // Check if it's the last file
            zip.generateAsync({ type: "blob" }).then((content) => {
              saveAs(content, elevName + ".zip");
            });
          }
        });
    });
  };

  return (
    <div
      style={{ display: "flex", justifyContent: "center", flexWrap: "wrap" }}
    >
      <button
        onClick={downloadAllFiles}
        style={{ margin: "20px", padding: "10px 20px" }}
      >
        Download All Files as ZIP
      </button>
    </div>
  );
};

export default ImageDisplay;
