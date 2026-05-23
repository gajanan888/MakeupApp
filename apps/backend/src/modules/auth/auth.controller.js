import {register, login} from './auth.service.js';

export const registerUser = async (req, res)=>{
    try{
        const user= await register(req.body);
        res.status(201).json({user})
    }catch(error){
        res.status(500).json({error: error.message});
    }
};

export const loginUser = async(req, res)=>{
    try{
        const data = await login(req.body);
        res.json(data);
    }catch(error){
        res.statuss(500).json({message:error.message});
    }
}