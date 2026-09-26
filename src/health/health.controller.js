import * as healthService from "./health.service.js";



const readinessCheck = async (req, res) =>
{
    const readiness = await healthService.readinessCheck();

    res.status(200).json(readiness);
};



const liveCheck = (req, res) =>
{
    res.status(200).json({ status: "live" });
}




export { 
    readinessCheck,
    liveCheck
 };