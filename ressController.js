import User from './Models/userModel.js';

export const fetch = async (req,res)=>{
  const alldata = await User.find();
  res.json(alldata);
}