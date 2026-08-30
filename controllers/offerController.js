const Offer = require("../models/Offer");
const NeedPost = require("../models/NeedPost");

const createOffer = async (req, res) => {
    try {
        const { needId } = req.params;

        const need = await NeedPost.findById(needId);

        if (!need) {
            return res.status(404).json({
                message: "Need not found"
            });
        }

        if (need.requestedBy.toString() === req.user.id) {
            return res.status(400).json({
                message: "You cannot offer help on your own request"
            });
        }

        const existingOffer = await Offer.findOne({
            need: needId,
            offeredBy: req.user.id
        });

        if (existingOffer) {
            return res.status(409).json({
                message: "You have already offered help"
            });
        }

        const offer = await Offer.create({
            need: needId,
            offeredBy: req.user.id
        });

        return res.status(201).json({
            message: "Help offer sent successfully",
            offer
        });

    } catch (error) {
        console.log(error);

        return res.status(500).json({
            message: "Something went wrong"
        });
    }
};


const getReceivedOffers = async (req, res) => {
    try {

        const offers = await Offer.find()
            .populate({
                path: "need",
                match: {
                    requestedBy: req.user.id
                }
            })
            .populate(
                "offeredBy",
                "name branch batch profileImage"
            );

        const receivedOffers = offers.filter(
            (offer) => offer.need !== null
        );

        return res.status(200).json({
            offers: receivedOffers
        });

    } catch (error) {

        console.log(error);

        return res.status(500).json({
            message: "Something went wrong"
        });
    }
};

const acceptOffer = async (req, res) => {
    try {
        const { offerId } = req.params;

        // Offer ke saath uska related "need" bhi nikal lo
        const offer = await Offer.findById(offerId).populate("need");

        if (!offer) {
            return res.status(404).json({ message: "Offer not found" });
        }

        const need = offer.need;

        // Sirf wahi student accept kar sake jisne ye need post ki thi
        if (need.requestedBy.toString() !== req.user.id) {
            return res.status(403).json({ message: "You are not allowed to do this" });
        }

        // Agar request pehle se hi matched/closed ho chuki hai, dobara accept na hone do
        if (need.status !== "open") {
            return res.status(400).json({ message: "This request is no longer open" });
        }

        // Is offer ko accept karo
        offer.status = "accepted";
        await offer.save();

        // Need ka status "matched" kar do
        need.status = "matched";
        await need.save();

        // Isi need ke baaki saare "pending" offers ko reject kar do
        await Offer.updateMany(
            {
                need: need._id,
                _id: { $ne: offer._id },
                status: "pending"
            },
            {
                status: "rejected"
            }
        );

        return res.status(200).json({ message: "Offer accepted" });

    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Something went wrong" });
    }
};


const rejectOffer = async (req, res) => {
    try {
        const { offerId } = req.params;

        const offer = await Offer.findById(offerId).populate("need");

        if (!offer) {
            return res.status(404).json({ message: "Offer not found" });
        }

        const need = offer.need;

        // Sirf wahi student reject kar sake jisne ye need post ki thi
        if (need.requestedBy.toString() !== req.user.id) {
            return res.status(403).json({ message: "You are not allowed to do this" });
        }

        // Sirf isi ek offer ko reject karo, baaki kisi ko haath mat lagao
        offer.status = "rejected";
        await offer.save();

        return res.status(200).json({ message: "Offer rejected" });

    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Something went wrong" });
    }
};


module.exports = {
    createOffer,
    getReceivedOffers,
    acceptOffer,
    rejectOffer
};