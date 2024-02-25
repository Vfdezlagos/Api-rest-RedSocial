import followModel from "../models/Follow.js";

const followUserIds = async (identityUserId) => {

    // Obtener info seguimiento

    let following = await followModel.find({'user': identityUserId})
                    .select({'followed': 1, '_id': 0})
                    .exec()
                    .then(follows => {
                        return follows;
                    })
                    .catch(error => {
                        return false;
                    })


    let followers = await followModel.find({'followed': identityUserId})
                    .select({'user': 1, '_id': 0})
                    .exec()
                    .then(follows => {
                        return follows;
                    })
                    .catch(error => {
                        return false;
                    });
    

    // Procesar array de identificadores
    let followingClean = [];

    following.forEach(follow => {
        followingClean.push(follow.followed);
    });

    // otra forma mas breve y pro
    let followersClean = followers.map(follow => follow.user);

    return {
        followingClean,
        followersClean
    }
}

const followThisUser = async (identityUserId, profileUserId) => {
    // Obtener info seguimiento

    let following = await followModel.findOne({'user': identityUserId, 'followed': profileUserId})
                    // .select({'followed': 1, '_id': 0})
                    .exec()
                    .then(follows => {
                        return follows;
                    })
                    .catch(error => {
                        return false;
                    })


    let follower = await followModel.findOne({'user': profileUserId, 'followed': identityUserId})
                    // .select({'user': 1, '_id': 0})
                    .exec()
                    .then(follows => {
                        return follows;
                    })
                    .catch(error => {
                        return false;
                    });

    return {
        following,
        follower
    }
}

export {
    followUserIds,
    followThisUser
}