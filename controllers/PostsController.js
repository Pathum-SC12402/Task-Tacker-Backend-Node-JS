const { date } = require("joi");

exports.getPosts = async (req, res) => {
    const {page} = req.query;
    const postsPerPage = 10;

    try{
        let pageNum = 0;
        if(page <= 1){
            pageNum = 0;
        }else{
            pageNum = page - 1;
        }
        const result = await post.find().sort({createdAt:-1}).skip(pageNum * postsPerPage).limit(postsPerPage).populate({
            path:'userId',
            select:'email',
        });
        res.status(200).json({success:true, message:'posts', data:result});
    }catch(err){
        console.error(err);
        res.status(500).json({message:"Server error"});
    }
}