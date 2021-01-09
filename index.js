const express = require("express");
const app = express();
const mongoose = require('mongoose');
const passport = require('passport');
const bodyparser = require('body-parser')
const methodoverride = require("method-override")
const User = require("./models/user")
const Localstrategy = require("passport-local")
const Comment = require("./models/comment")
const Subject = require("./models/subject")
const Discussion = require("./models/discussion")
const flash = require("connect-flash");
const discussion = require("./models/discussion");
mongoose.connect('mongodb://localhost:27017/hackathondb', { useNewUrlParser: true, useUnifiedTopology: true })
const courseLists = require("./data/data.json");
const user = require("./models/user");
const AppError = require("./AppError");

app.set("view engine", "ejs");
app.use(bodyparser.urlencoded({ extended: true }));
app.set("view engine", "ejs");
app.use(express.static(__dirname + "/public"));
app.use(methodoverride("_method"));

app.use(require("express-session")({
    secret: "Rusty is the best and cuttest dog in world",
    resave: false,
    saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());
passport.use(new Localstrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());
app.use(flash());

app.use(function (req, res, next) {
    res.locals.currentUser = req.user;
    res.locals.error = req.flash("error");
    res.locals.success = req.flash("success");
    next();
});

app.get("/", function (req, res) {

    console.log("request for landing page");
    res.render("landing");
});

app.get("/courses", isLoggedIn, function (req, res) {

    User.findById(req.user._id).exec(function (err, currentUser) {
        if (err) {
            throw new AppError('User not found', 401);
        }
        else {
            var branch = currentUser.branch
            console.log("courses");
            console.log(currentUser);
            console.log(branch);

            console.log(courseLists[branch]);
            res.render("courses/courses", { courselist: courseLists[branch] });
        }

    })
});

app.get("/trending/:courseName", isLoggedIn, function (req, res) {
    const sort = { "comments": -1 };
    Subject.find({ subName: req.params.courseName }).populate("questions").exec(function (err, subject) {
        if (err) {
            console.log(err);
            throw new AppError('subject not found with this courseName', 403);
        }
        else {
            console.log(subject[0]);
            console.log("hello")
            console.log(subject[0].questions);
            subject[0].questions.sort((a, b) => (a.comments.length > b.comments.length) ? -1 : ((b.comments.length > a.comments.length) ? 1 : 0));
            res.render("courses/trending", { subject: subject[0], courseName: req.params.courseName });
        }
    })

});

app.post('/discussions/:id/addtobookmark', isLoggedIn, function (req, res) {
    User.findById(req.user._id).populate("questionbookmarkedbyme").exec(function (err, currentUser) {
        if (err) {
            console.log(err);
            res.flash('error', 'could not add it');
            throw new AppError('User not found', 401);
        }
        else {
            Discussion.findById(req.params.id).populate("comments").exec(function (err, foundDiscussion) {
                if (err) {
                    console.log(err);
                    res.flash('error', 'could not add it');
                    throw new AppError('requested discussion could not be accesed', 401);
                }
                else {
                    currentUser.questionbookmarkedbyme.push(foundDiscussion);
                    currentUser.save();
                    console.log(currentUser.questionbookmarkedbyme);
                    req.flash("success", "Successfully added to bookmarks");
                    res.render("discussion/show", { discussion: foundDiscussion, check: true });
                }
            })
        }
    });
});

app.post('/discussions/:id/removefrombookmark', isLoggedIn, function (req, res) {
    User.findById(req.user._id).populate("questionbookmarkedbyme").exec(function (err, currentUser) {
        if (err) {
            console.log(err);
            res.flash('error', 'could not remove it');
            throw new AppError('User not found', 403);
        }
        else {
            Discussion.findById(req.params.id).populate("comments").exec(function (err, foundDiscussion) {
                if (err) {
                    console.log(err);
                    res.flash('error', 'could not remove it');
                    throw new AppError('requested discussion could not be accesed', 401);
                }
                else {
                    currentUser.questionbookmarkedbyme.pull(foundDiscussion);
                    currentUser.save();
                    console.log(currentUser.questionbookmarkedbyme);
                    req.flash("success", "Successfully removed from bookmarks");
                    res.render("discussion/show", { discussion: foundDiscussion, check: false });
                }
            })
        }
    });
});

app.get("/bookmarks", isLoggedIn, function (req, res) {

    console.log("request for bookmarks page");
    User.findById(req.user._id).populate("questionbookmarkedbyme").exec(function (err, currentUser) {
        res.render("bookmarks", { currentUser: currentUser });

    })
});

app.get("/myquestion", isLoggedIn, function (req, res) {
    User.findById(req.user._id).populate("questionsaskedbyme").exec(function (err, currentUser) {
        console.log("my page");
        res.render("myquestion", { currentUser: currentUser });

    })


});

app.get("/aboutus", function (req, res) {

    console.log("request for about us page");
    res.render("aboutUs");
});

app.get("/ranking", isLoggedIn, function (req, res) {
    User.findById(req.user._id).exec(function (err, currentUser) {
        var branch = currentUser.branch;
        User.find({ branch: branch }).exec(function (err, currentUsers) {
            console.log(currentUsers)
            currentUsers.sort((a, b) => (a.totalAnswered > b.totalAnswered) ? -1 : ((b.totalAnswered > a.totalAnswered) ? 1 : 0));
            res.render("ranking", { currentUsers: currentUsers, i:1 });
        })
    })
});


//############################################################
//login and register functionality

app.get("/register", function (req, res) {
    console.log("Register page");
    res.render("register");

});

app.post("/register", function (req, res) {
    var newUser = new User({ username: req.body.username, branch: req.body.branch, enrollmentNo: req.body.enrollmentNo });

    User.register(newUser, req.body.password, function (err, user) {
        if (err) {
            console.log(err);
            req.flash("error", err.message);
            return res.render("register");
        }
        passport.authenticate("local")(req, res, function () {
            req.flash("success", "Welcome to Our Website " + user.username);
            console.log(user);
            res.redirect("/");
        });
    });
});

app.get("/login", function (req, res) {
    console.log("Register page");
    res.render("login");

});

app.post("/login", passport.authenticate("local", {
    failureFlash: true,
    failureRedirect: "/login"
}), function (req, res) {
    req.flash('success', 'welcome back');
    const redirectUrl = req.session.returnTo || '/';
    delete req.session.returnTo;
    res.redirect(redirectUrl);

});

app.get("/logout", function (req, res) {
    req.logOut();
    req.flash("success", "Logged you out!!")
    res.redirect("/");
});


app.post("/bookmarked", isLoggedIn, function (req, res) {
    User.findById(req.user.id).exec(function (err, currUser) {
        if (err) {
            console.log(err);
            throw new AppError();
        }
        else {
            currUser.questionsbookmarkedbyme.push(discussion);
            currUser.save();
            res.redirect("back");
        }

    })
})


//discussion page
//########################################################

app.get("/courses/:courseName", isLoggedIn, async (req, res, next) => {
    try {
        const courseName = req.params.courseName;
        console.log((await Subject.exists({ subName: courseName })));
        User.findById(req.user._id).exec(async (err, currentUser) => {
            if (err) {
                console.log(err);
            }
            else {
                var branch = currentUser.branch;
                var flag = false;
                for (let index = 0; index < courseLists[branch].items.length; index++) {
                    const element = courseLists[branch].items[index];
                    if (element.courseCode === courseName) {
                        flag = true;
                        break;
                    }
                }
                if (!flag) {
                    req.flash("error", "Course does not exist");
                    res.redirect("/");
                }
                else {
                    await Subject.exists({ subName: courseName }, function (err, result) {
                        if (!result) {
                            var subject = courseName;
                            console.log("No Bug");
                            var newSubject = { subName: subject }
                            Subject.create(newSubject, function (err, newsubject) {
                                if (err) {
                                    console.log("error");
                                }
                                else {
                                    console.log(newSubject);
                                    newsubject.save();
                                    res.render("courses/show", { subject: newsubject, courseName: courseName });
                                }
                            })
                        }
                        else {
                            console.log("BUGS");
                            Subject.find({ subName: courseName }).populate("questions").exec(function (err, subject) {
                                if (err) {
                                    console.log("something went wrong");
                                    console.log(err);
                                } else {
                                    res.render("courses/show", { subject: subject, courseName: courseName });
                                }
                            });
                        }
                    })
                }
            }

        })
    }
    catch (e) {
        next(e);
    }
})

app.get("/courses/:courseName/new", isLoggedIn, function (req, res) {

    res.render("courses/new", { courseName: req.params.courseName })
    console.log("form for posting question")
})

app.post("/courses/:courseName", isLoggedIn, function (req, res) {
    const courseName = req.params.courseName;

    Subject.find({ subName: courseName }).exec(function (err, foundSubject) {
        if (err) {
            console.log("something went wrong");
            console.log(err);
            throw new AppError();

        }
        else {
            var topic = req.body.topic;
            var question = req.body.question;
            var author = {
                username: req.user.username,
                id: req.user._id
            };
            var anonymouslyAsked = req.body.isAnonymous;
            var course = courseName;
            var newDiscussion = { topic: topic, question: question, author: author, course: course, anonymouslyAsked: anonymouslyAsked };
            Discussion.create(newDiscussion, function (err, newdiscussion) {
                if (err) {
                    console.log(err);
                    console.log(newdiscussion)
                    throw new AppError();
                }
                else {
                    console.log(foundSubject);
                    console.log(newdiscussion);
                    console.log(foundSubject[0].subName);
                    console.log(foundSubject[0].questions);
                    foundSubject[0].questions.push(newdiscussion);
                    foundSubject[0].save();
                    console.log(newdiscussion);
                    User.findById(req.user._id).exec(function (err, currentUser) {
                        if (err) {
                            console.log(err);
                            throw new AppError();

                        }
                        else {
                            currentUser.questionsaskedbyme.push(newdiscussion);
                            currentUser.totalAsked = currentUser.totalAsked + 1;
                            console.log(currentUser.totalAsked);
                            currentUser.save();
                            req.flash("success", "Sucessfully posted your question");
                            res.redirect("/courses/" + courseName);
                        }

                    })

                }
            })

        }
    })
})

//##################################################################################################
//discussion
app.get("/discussions/:id", isLoggedIn, async (req, res, next) => {
    try {
        await Discussion.findById(req.params.id).populate("comments").exec(async (err, founddiscussion, next) => {
            if (err) {
                console.log(err);
                next(new AppError());
            }
            else {
                var check = false;//findIndex(req.params.id)
                await User.findById(req.user._id).exec(function (err, currUser) {

                    if (err) {
                        console.log(err);
                    }
                    else {
                        console.log(currUser.questionbookmarkedbyme);
                        if (currUser.questionbookmarkedbyme.length > 0) {
                            if (currUser.questionbookmarkedbyme.includes(req.params.id)) {
                                check = true;
                            }
                        }
                        console.log(check);
                        res.render("discussion/show", { discussion: founddiscussion, check: check });
                    }

                });


            }

        })
    }
    catch (e) {
        next(e);
    }
})

app.get("/discussions/:id/goback", isLoggedIn, function (req, res) {

    Discussion.findById(req.params.id).exec(function (err, founddiscussion) {
        if (err) {
            console.log(err);
            throw new AppError();
        }
        else {
            var courseName = founddiscussion.course;
            res.redirect("/courses/" + courseName);
        }
    })

})

app.get("/discussions/:id/edit", checkDiscussionOwnership, function (req, res) {
    Discussion.findById(req.params.id, function (err, founddiscussion) {
        res.render("discussion/edit", { discussion: founddiscussion });
    });
})

app.post("/discussions/:id/comment/:comment_id/like", isLoggedIn, function (req, res) {
    console.log("rahul")
    Comment.findById(req.params.comment_id, function (err, foundComment) {
        if (err) {
            res.redirect("/discussions/" + req.params.id);
        }
        else {
            if (foundComment.likedby.includes(req.user._id)) {
                console.log("Already Liked");
                req.flash("success", "Already Liked");
                console.log(foundComment.likedby.length);

            } else {
                foundComment.likedby.push(req.user._id);
                foundComment.save();
                console.log(foundComment.likedby.length);
                req.flash("success", "Liked");
            }
            res.redirect("/discussions/" + req.params.id);
        }

    });
})




app.put("/discussions/:id", checkDiscussionOwnership, function (req, res) {
    //find and update the correct discussion and redirect
    Discussion.findByIdAndUpdate(req.params.id, req.body.discussion, function (err, updateddiscussion) {
        if (err) {
            res.redirect("/discussions");

        } else {
            req.flash("success", "Successfully Updated");
            res.redirect("/discussions/" + req.params.id);
        }
    })
});

app.delete("/discussions/:id", checkDiscussionOwnership, function (req, res) {
    var courseName = '';
    Discussion.findById(req.params.id).exec(function (err, founddiscussion) {
        if (err) {
            console.log(err);
            throw new AppError();
        }
        else {
            courseName = founddiscussion.course;

        }
    })
    Discussion.findByIdAndRemove(req.params.id, function (err,) {
        if (err) {
            res.redirect("/courses/" + courseName);
        } else {
            User.findById(req.user._id).exec(function (err, currentUser) {
                if (err) {
                    console.log(err);
                    throw new AppError('User not found', 401);
                }
                else {
                    currentUser.questionsaskedbyme.pull(req.params.id);
                    currentUser.totalAsked = currentUser.totalAsked - 1;
                    currentUser.save();
                    console.log(currentUser.totalAsked);
                    req.flash("success", "Successfully Deleted");
                    res.redirect("/courses/" + courseName);
                }
            })

        }
    });
});

//###########################################################################################################
app.get("/discussions/:id/comments/new", isLoggedIn, function (req, res) {
    Discussion.findById(req.params.id, function (err, discussion) {
        if (err) {
            console.log("something went wrong");
            throw new AppError();
        } else {
            res.render("comments/new", { discussion: discussion });
        }
    });
});

app.post("/discussions/:id/comments", isLoggedIn, function (req, res) {
    Discussion.findById(req.params.id, function (err, discussion) {
        if (err) {
            console.log(err);
            throw new AppError();

        } else {
            var text = req.body.comment;
            var author = {
                username: req.user.username,
                id: req.user.id
            }
            var newComment = { text: text, author: author }
            Comment.create(newComment, function (err, comment) {
                if (err) {
                    req.flash("error", "Something went wrong,Try again!!");
                    console.log(err);
                    throw new AppError();
                } else {

                    comment.save();

                    discussion.comments.push(comment);
                    discussion.save();
                    User.findById(req.user._id).exec(function (err, currentUser) {
                        currentUser.totalAnswered = currentUser.totalAnswered + 1;
                        currentUser.save();
                        req.flash("success", "Successfully added Comment");
                        res.redirect("/discussions/" + discussion._id);
                        console.log(comment);
                    })
                }
            })

        }
    });
});


//=============================================
//comment delete and edit route
//=============================================
//comment form display
app.get("/discussions/:id/comments/:comment_id/edit", checkCommentOwnership, function (req, res) {
    Comment.findById(req.params.comment_id, function (err, foundcomment) {
        if (err) {
            res.redirect("back");
        } else {
            res.render("comments/edit", { discussion_id: req.params.id, comment: foundcomment });
        }
    })

});
//comment put request
app.put("/discussions/:id/comments/:comment_id", checkCommentOwnership, function (req, res) {
    Comment.findByIdAndUpdate(req.params.comment_id, req.body.comment, function (err, updatedcomment) {
        if (err) {
            req.flash("error", "Something went wrong,Try again!!");
            res.redirect("back");
        } else {
            req.flash("success", "Successfully Updated");
            res.redirect("/discussions/" + req.params.id);
        }
    });
});

//Comment delete
app.delete("/discussions/:id/comments/:comment_id", checkCommentOwnership, function (req, res) {

    //find by id and remove

    Comment.findByIdAndDelete(req.params.comment_id, function (err) {
        if (err) {
            res.redirect("back");
        } else {
            Discussion.findById(req.params.id, function (err, foundDiscussion) {
                if (err) {
                    console.log(err);
                }
                else {

                    foundDiscussion.comments.pull(req.params.comment_id);
                    foundDiscussion.save();
                    User.findById(req.user._id).exec(function (err, currentUser) {
                        currentUser.totalAnswered = currentUser.totalAnswered - 1;
                        currentUser.save();
                        req.flash("success", "Comment deleted");
                        res.redirect("/discussions/" + req.params.id);
                    })

                }
            })

        }
    });
});
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


function checkDiscussionOwnership(req, res, next) {
    if (req.isAuthenticated()) {
        Discussion.findById(req.params.id, function (err, founddiscussion) {
            if (err) {
                res.redirect("back");
            } else {
                //does the user owned champground
                if (founddiscussion.author.id.equals(req.user._id)) {
                    next();
                }
                //otherwise redirect
                else {
                    req.flash("error", "You dont have permission to do that");
                    res.redirect("back");
                }
            }
        });
    } else {
        req.flash("error", "You don't have permission to do that");
        res.redirect("back");
    }
}

//check comment ownership
function checkCommentOwnership(req, res, next) {
    if (req.isAuthenticated()) {
        Comment.findById(req.params.comment_id, function (err, foundComment) {
            if (err) {
                req.flash("error", "Champground not found");
                res.redirect("back");
            } else {
                //does the user owned comment
                if (foundComment.author.id.equals(req.user._id)) {
                    next();
                }
                //otherwise redirect
                else {
                    req.flash("error", "You dont have permission to do that");
                    res.redirect("back");
                }
            }
        });
    } else {
        res.redirect("back");
    }
}

function isLoggedIn(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
        //console.log(User);
    }
    //console.log();
    req.session.returnTo = req.originalUrl;
    req.flash('error', "You need to be logged in to do that");
    res.redirect("/login");
};

app.all('*', (req, res, next) => {
    next(new AppError('Page Not Found', 404));
})

app.use((err, req, res, next) => {
    const { status = 500, message = 'Something Went Wrong' } = err;
    res.status(status).send(message);
})

app.listen(3000, function () {
    console.log("Hackathon server has allready started!!");
});

