const NeedPost = require("../models/NeedPost");

const createNeed = async (req, res) => {
    try {
        const {
            itemName,
            description,
            neededBy,
            durationValue,
            durationUnit
        } = req.body;

        const need = await NeedPost.create({
            requestedBy: req.user.id,
            itemName,
            description,
            neededBy,
            durationValue,
            durationUnit
        });

        return res.status(201).json({
            message: "Need posted successfully",
            need
        });

    } catch (error) {
        console.log(error);

        return res.status(500).json({
            message: "Something went wrong"
        });
    }
};


const getAllNeeds = async (req, res) => {
    try {
        // Sirf wahi requests dikhao jo abhi khuli hain.
        // matched/closed wali pehle bhi dikh rahi thi, aur unpe
        // "I Can Help" dabane par error aata tha.
        const needs = await NeedPost.find({ status: "open" })
            .populate("requestedBy", "name branch batch")
            .sort({ createdAt: -1 });

        return res.status(200).json({ needs });
    }
    catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Something went wrong" });
    }
};

// Sirf logged-in user ke apne posted needs dena (Profile page ke liye)
const getMyNeeds = async (req, res) => {
    try {
        const needs = await NeedPost.find({ requestedBy: req.user.id })
            .sort({ createdAt: -1 });

        return res.status(200).json({ needs });

    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Something went wrong" });
    }
};


// AI Post Assistant: student ek line likhta hai, Gemini use
// itemName/description/neededBy/duration mein tod deta hai.
const parseNeedWithAI = async (req, res) => {
    try {
        const { text } = req.body;

        if (!text) {
            return res.status(400).json({ message: "Kuch to likho pehle" });
        }

        const today = new Date().toISOString().slice(0, 10);

        const prompt =
            "Tum ek assistant ho jo student ke ek chhote se message se " +
            "ek 'need request' banate ho. Aaj ki date hai " + today + ". " +
            "Student ne likha hai: \"" + text + "\". " +
            "Isse neeche diye gaye fields mein todho. " +
            "itemName mein sirf 2-4 words mein cheez ka naam likho. " +
            "description mein 1-2 line mein kyun chahiye wo likho. " +
            "neededBy mein exact date-time do (YYYY-MM-DDTHH:mm format mein), " +
            "agar time na bataya ho to subah 9 baje maan lo. " +
            "durationValue aur durationUnit mein kitni der ke liye chahiye wo do, " +
            "agar kuch na bataya ho to 1 din maan lo.";

        const aiResponse = await fetch(
            "https://generativelanguage.googleapis.com/v1beta/interactions",
            {
                method: "POST",
                headers: {
                    "x-goog-api-key": process.env.GEMINI_API_KEY,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    model: "gemini-3.8-flash",
                    input: prompt,
                    response_format: {
                        type: "text",
                        mime_type: "application/json",
                        schema: {
                            type: "object",
                            properties: {
                                itemName: { type: "string" },
                                description: { type: "string" },
                                neededBy: { type: "string" },
                                durationValue: { type: "number" },
                                durationUnit: {
                                    type: "string",
                                    enum: ["hours", "days", "weeks"]
                                }
                            },
                            required: [
                                "itemName",
                                "description",
                                "neededBy",
                                "durationValue",
                                "durationUnit"
                            ]
                        }
                    }
                })
            }
        );

        const result = await aiResponse.json();

        if (!aiResponse.ok) {
            console.log(result);
            return res.status(500).json({ message: "AI se baat nahi ho payi" });
        }

        const fields = JSON.parse(result.output_text);

        return res.status(200).json(fields);

    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "AI se baat nahi ho payi" });
    }
};


module.exports = {
    createNeed, getAllNeeds, getMyNeeds, parseNeedWithAI
};