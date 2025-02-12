import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js"
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js";

const generateAccessAndRefreshTokens= async (userId)=>{
    try {

        const user = await User.findById(userId);
        const accessToken =  user.generateRefreshToken()
        const refreshToken = user.generateAccessToken()

        user.refreshToken = refreshToken
        await user.save({validateBeforeSave : false})

        return {accessToken,refreshToken}
        
    } catch (error) {
        throw new ApiError(500 , "Something went wrong while genereeating refresh and access token")
    }
}

const registerUser = asyncHandler(async (req, res) => {

    // get user details from frontend
    // Validation --> not empty
    // Check if already exists : username , email
    // Avatar check , Image Check
    // upload them to cloudinary , avatar check
    // Create a User Object --> create entry in db
    // Remove password and refresh token field from response
    // check for user creation
    // return response

    const { fullName, username, email, password } = req.body
    // console.log("email : ", email);

    // if(fullName===""){
    //     throw new ApiError(400,"fullname is required")
    // }

    if ([fullName, email, username, password].some((field) => (field?.trim() === ""))) {
        throw new ApiError(400, "All fields are required")
    }

    const existedUser = await User.findOne({
        $or: [{ username }, { email }]
    })

    if (existedUser) {
        throw new ApiError(409, "User with email or username already exists")
    }

    console.log(req.files);

    //multer dwara 
    const avatarLocalPath = req.files?.avatar[0]?.path;

    // const coverImageLocalPath = req.files?.coverImage[0]?.path;

    let coverImageLocalPath;
    if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length>0){
        coverImageLocalPath = req.files.coverImage[0].path
    }

    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is required")
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if (!avatar) {
        throw new ApiError(400, "Avatar file is required")
    }

    const user = await User.create({
        fullName,
        avatar : avatar.url,
        coverImage : coverImage?.url||"",
        email,
        password,
        username:username.toLowerCase()
    })

    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )

    if(!createdUser){
        throw new ApiError(500,"Something went wrong while registering the user")
    }

    return res.status(201).json(
        new ApiResponse(200,createdUser,"User Registered Succeessfully")
    )
})

const loginUser = asyncHandler(async(req,res)=>{
    //req body -> data
    //Username || email 
    //find the user
    //password check
    //access and RefreshToken generate
    //send these tokens in cookies

    const {username,email,password} = req.body;

    if(!username && !email){
        throw new ApiError(400,"Username or email is required")
    }

    const user = await User.findOne({
        $or : [{email} , {username}]
    })

    if(!user){
        throw new ApiError(404, "User doesnt exists")
    }
    
    // //! This user is not Database ones V.V.V.I.M.P
    const isPasswordValid = await user.isPasswordCorrect(password)
    
    if(!isPasswordValid){
        throw new ApiError(401, "Invalid User Credentials")
    }

    //Access and Refresh tokens --> Generation is very common so we will create a function

    const {refreshToken , accessToken} = await generateAccessAndRefreshTokens(user._id);

    //cookies 

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")
    // for cookies
    // by default anyone can access the cookie and modify
    // if u do http = true , secure = true then only backend can update
    const options = {
        httpOnly : true,
        secure : true
    }
    
    return res
    .status(200)
    .cookie("accessToken",accessToken,options)
    .cookie("refreshToken",refreshToken,options)
    .json(
        new ApiResponse(200,{
            user : loggedInUser ,accessToken,refreshToken
        } , "User Logged In Successfully")
    )

})

const logoutUser = asyncHandler(async(req,res)=>{
    await User.findByIdAndUpdate(req.user._id, {
        $set : {
            refreshToken : undefined
        }
    },{
        new : true
    })

    const options = {
        httpOnly : true,
        secure : true
    }

    return res
    .status(200)
    .clearCookie("accessToken",options)
    .clearCookie("refreshToken",options)
    .json(new ApiResponse(200,{},"User logged out successfully"))
})

export { registerUser, loginUser ,logoutUser}