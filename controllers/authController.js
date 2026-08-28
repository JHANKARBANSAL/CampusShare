const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt=require("jsonwebtoken");

const signup = async (req, res) => {

    try {

        // Frontend signup form se data
        const {
            name,
            email,
            password,
            branch,
            batch,
            enrollmentNumber
        } = req.body;


        // Check user already exists
        const existingUser = await User.findOne({
            email: email
        });


        if (existingUser) {
            return res.status(409).json({
                message: "User already exists"
            });
        }


        // Password hash
        const hashedPassword = await bcrypt.hash(password, 10);


        // MongoDB mein user save
        await User.create({
            name: name,
            email: email,
            password: hashedPassword,
            branch: branch,
            batch: batch,
            enrollmentNumber: enrollmentNumber
        });


        // Success response
        return res.status(201).json({
            message: "Account created successfully"
        });


    } catch (error) {

        console.log(error);

        return res.status(500).json({
            message: "Something went wrong"
        });
    }
};




const login=async(req,res)=>
{
    try
    {
        const {
            email,
            password}=req.body;

            //checing if it matches woth the stored data 
            const user=User.findOne({
                email:email});



                if(!user)
                {
                    return res.Status(401).json({
                        message:"user not found"
                    });
                }

                //compare the enntered password with the encrypted password from the database
                const isPasswordCorrect=await bcrypt.compare(password,user.password);

                if (!isPasswordCorrect) {
            return res.status(401).json({
                message: "Invalid email or password"
            });
        }

        // 6. Password correct → JWT token generate
        const token = jwt.sign(
            {
                userId: user._id
            },
            process.env.JWT_SECRET,
            {
                expiresIn: "1d"
            }
        );


        // 7. Token frontend ko bhej diya
        return res.status(200).json({
            message: "Login successful",
            token: token
        });
    }
    catch(error)
    {
        return res.status(500).json({
            message:"Something went wrong"
        });
    }
};

module.exports = {
    signup,
    login
};