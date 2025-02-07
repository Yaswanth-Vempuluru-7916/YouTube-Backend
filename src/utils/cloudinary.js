import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs'

// Configuration
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const uploadOnCloudinary = async (localFilePath) => {
    try {
        if (!localFilePath) return null;
        //upload the file on cloudinary

        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto"
        })

        //File has been uploaded successfully
        console.log(`FILE UPLOADED ON CLOUDINARY SUCCESSFULLY ✅ , ${response.url}`);
        return response;
    } catch (error) {
        fs.unlinkSync(localFilePath) //!Remove the locally saved temporary file it may be malicious also as the operation got failed 
        return null;
    }
}


export {uploadOnCloudinary}
