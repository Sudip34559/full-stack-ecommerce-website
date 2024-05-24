import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_CLOUD_KEY,
  api_secret: process.env.CLOUDINARY_CLOUD_SECRET,
});

const uploadOnCloudinery = async (localFilePath) => {
  try {
    if (!localFilePath) return null;
    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
    });
    fs.unlinkSync(localFilePath);
    return response;
  } catch (error) {
    fs.unlinkSync(localFilePath);
    return null;
  }
};
const removeOnCloudinery = async (localFilePath) => {
  try {
    const imagePublicId = localFilePath.split("/").pop().split(".")[0];
    if (!localFilePath) return null;
    const response = await cloudinary.uploader.destroy(imagePublicId, {
      resource_type: "auto",
    });
    return response;
  } catch (error) {
    return null;
  }
};

export { uploadOnCloudinery, removeOnCloudinery };
