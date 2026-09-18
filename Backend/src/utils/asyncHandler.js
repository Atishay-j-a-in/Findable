<<<<<<< HEAD

const asyncHandler =(fn) => async(req,res,next)=>{
    try{
        await fn(req,res,next);
    }
    catch(err){
        console.error("OCR request failed:", err);
        res.status(err.code || 500).json({
            success:false,
            message:err.message || "Internal Server Error"
        })
    }
 }

=======

const asyncHandler =(fn) => async(req,res,next)=>{
    try{
        await fn(req,res,next);
    }
    catch(err){
        res.status(err.code || 500).json({
            success:false,
            message:err.message || "Internal Server Error"
        })
    }
 }

>>>>>>> 79bfc919c7813b3c0f68aeb5fb5a5b53fca2cbb7
 export {asyncHandler}