var UserComment = /** @class */ (function () {
  function UserComment(
    name,
    ava,
    data,
    text,
    favoriteButtonClass,
    isVoted,
    counterValue,
    counterNumber,
    commentSystem,
    answers
  ) {
    if (answers === void 0) {
      answers = [];
    }
    this.name = name;
    this.ava = ava;
    this.data = data;
    this.text = text;
    this.favoriteButtonClass = favoriteButtonClass;
    this.isVoted = isVoted;
    this.counterValue = counterValue;
    this.counterNumber = counterNumber;
    this.commentSystem = commentSystem;
    this.answers = answers;
    this.favoriteButton = document.createElement("button");
    this.counter = document.createElement("div");
    this.minusButton = document.createElement("button");
    this.plusButton = document.createElement("button");
    this.commentBox = this.createCommentBox();
  }
  UserComment.prototype.createCommentBox = function () {
    var _this = this;
    var commentBox = document.createElement("div");
    commentBox.className = "block_com";
    commentBox.innerHTML =
      '\n    <div class="src_com">\n        <div class="ava" style=\'background-image: '
        .concat(
          this.ava,
          '\'></div>\n        <div class="com_aspects">\n            <div class="com_name">'
        )
        .concat(this.name, '</div>\n            <div class="com_data">')
        .concat(
          this.data,
          '</div>\n        </div>\n        <div class="com_txt">'
        )
        .concat(this.text, "</div>\n    </div>\n    ");
    var replyButton = document.createElement("button");
    replyButton.className = "btn_reply";
    var img = document.createElement("img");
    img.src = "./svg/left.svg";
    img.className = "reply_icon";
    replyButton.addEventListener("click", function () {
      _this.commentSystem.manageReply(_this);
    });
    var buttonText = document.createTextNode("Ответить");
    replyButton.appendChild(img);
    replyButton.appendChild(buttonText);
    this.favoriteButton.className = "btn_favorite";
    this.favoriteButton.innerHTML =
      '\n      <img src="./svg/heart.svg" class="heart '.concat(
        this.favoriteButtonClass,
        '"> \u0418\u0437\u0431\u0440\u0430\u043D\u043D\u043E\u0435\n    '
      );
    this.favoriteButton.addEventListener("click", function () {
      var heartIcon = _this.favoriteButton.querySelector(".heart");
      heartIcon === null || heartIcon === void 0
        ? void 0
        : heartIcon.classList.toggle("gray");
      _this.favoriteButtonClass = (
        heartIcon === null || heartIcon === void 0
          ? void 0
          : heartIcon.classList.contains("gray")
      )
        ? "gray"
        : "";
      _this.commentSystem.saveCommentsToLocalStorage();
    });
    var buttonContainer = document.createElement("div");
    buttonContainer.className = "cont_btn";
    buttonContainer.appendChild(replyButton);
    buttonContainer.appendChild(this.favoriteButton);
    var counterContainer = document.createElement("div");
    counterContainer.className = "counter_box";
    this.counter.className = "counter";
    this.counter.innerText = this.counterValue.toString();
    this.counter.style.color = this.counterValue >= 0 ? "green" : "red";
    this.minusButton.className = "counter_btn";
    this.minusButton.innerText = "-";
    this.minusButton.style.color = "red";
    this.minusButton.addEventListener(
      "click",
      this.decrementCounter.bind(this)
    );
    this.plusButton.className = "counter_btn";
    this.plusButton.innerText = "+";
    this.plusButton.style.color = "green";
    this.plusButton.addEventListener("click", this.incrementCounter.bind(this));
    counterContainer.appendChild(this.minusButton);
    counterContainer.appendChild(this.counter);
    counterContainer.appendChild(this.plusButton);
    buttonContainer.appendChild(counterContainer);
    commentBox.appendChild(buttonContainer);
    this.answers.forEach(function (comment) {
      var rendered = comment.render();
      rendered.className = "block_com_reply";
      commentBox.appendChild(rendered);
    });
    return commentBox;
  };
  UserComment.prototype.decrementCounter = function () {
    if (this.isVoted) {
      return;
    }
    this.isVoted = true;
    this.counterNumber += 1;
    this.counterValue -= 1;
    this.counter.innerText = this.counterValue.toString();
    this.counter.style.color = this.counterValue < 0 ? "red" : "green";
    this.commentSystem.saveCommentsToLocalStorage();
    this.commentSystem.renderComments();
  };
  UserComment.prototype.incrementCounter = function () {
    if (this.isVoted) {
      return;
    }
    this.isVoted = true;
    this.counterNumber += 1;
    this.counterValue += 1;
    this.counter.innerText = this.counterValue.toString();
    this.counter.style.color = this.counterValue >= 0 ? "green" : "red";
    this.commentSystem.saveCommentsToLocalStorage();
    this.commentSystem.renderComments();
  };
  UserComment.prototype.render = function () {
    return this.commentBox;
  };
  UserComment.prototype.toJSON = function () {
    var answers = [];
    this.answers.forEach(function (ans) {
      answers.push(ans.toJSON());
    });
    return {
      name: this.name,
      ava: this.ava,
      data: this.data,
      text: this.text,
      favoriteButtonClass: this.favoriteButtonClass,
      isVoted: this.isVoted,
      counterValue: this.counterValue.toString(),
      counterNumber: this.counterNumber.toString(),
      answers: JSON.stringify(answers),
    };
  };
  return UserComment;
})();
var CommentSystem = /** @class */ (function () {
  function CommentSystem() {
    this.textarea = document.getElementById("comment_input");
    this.counter = document.querySelector(".max_comment");
    this.sendButton = document.querySelector("#send_com");
    this.dropDown = document.querySelector(".list_button");
    this.arrow = document.querySelector(".arrow_down img");
    this.dropdownContent = document.querySelector(".list_cont");
    this.onlyFavoritesButton = document.querySelector(".favorite_txt");
    this.replyComment = document.querySelector(".com_reply");
    this.replyCancel = document.querySelector(".cancel_reply");
    this.userName = document.querySelector(".name_txt.max_name");
    this.userAva = document.querySelector(".max_img img");
    this.sortingOrder = "asc";
    this.selectedSort = "date";
    this.commentList = [];
    this.onlyFavorites = false;
    this.replyToComment = null;
    this.getUser();
    this.init();
  }
  CommentSystem.prototype.init = function () {
    this.textarea.addEventListener("input", this.updateCounter.bind(this));
    this.sendButton.addEventListener("click", this.addComment.bind(this));
    this.dropDown.addEventListener("click", this.dropDownClick.bind(this));
    this.arrow.addEventListener("click", this.changeOrder.bind(this));
    this.dropdownContent.addEventListener(
      "click",
      this.dropDownSelect.bind(this)
    );
    this.onlyFavoritesButton.addEventListener(
      "click",
      this.favoriteSort.bind(this)
    );
    this.replyCancel.addEventListener("click", this.clearReply.bind(this));
    this.renderComments();
  };
  CommentSystem.prototype.manageReply = function (comment) {
    this.textarea.focus();
    this.counter.scrollIntoView({ behavior: "smooth", block: "center" });
    this.replyComment.style.display = "block";
    var replyText = this.replyComment.querySelector(".to_reply");
    replyText.innerText = "\u041E\u0442\u0432\u0435\u0442 \u043D\u0430 ".concat(
      comment.name
    );
    this.replyToComment = comment;
  };
  CommentSystem.prototype.clearReply = function () {
    this.replyToComment = null;
    this.replyComment.style.display = "none";
  };
  CommentSystem.prototype.dropDownClick = function () {
    var dropdownContent = this.dropDown.nextElementSibling;
    dropdownContent.style.display =
      dropdownContent.style.display === "block" ? "none" : "block";
  };
  CommentSystem.prototype.favoriteSort = function () {
    this.onlyFavorites = !this.onlyFavorites;
    this.renderComments();
  };
  CommentSystem.prototype.changeOrder = function () {
    if (this.sortingOrder === "asc") {
      this.sortingOrder = "desc";
    } else {
      this.sortingOrder = "asc";
    }
    var arrow_down = document.querySelector(".arrow_down");
    arrow_down.classList.toggle("active");
    this.renderComments();
  };
  CommentSystem.prototype.dropDownSelect = function (event) {
    var element = event.target;
    if (element.tagName === "BUTTON") {
      document.querySelectorAll(".list_item").forEach(function (item) {
        return item.classList.remove("selected");
      });
      element.classList.add("selected");
      document.querySelector(".list_button").textContent = element.textContent;
      this.dropdownContent.style.display = "none";
      var selectedValue = element.getAttribute("data-value");
      this.selectedSort = selectedValue == null ? "date" : selectedValue;
      this.renderComments();
    }
  };
  CommentSystem.prototype.updateCounter = function () {
    var textLength = this.textarea.value.length;
    this.counter.textContent = "".concat(textLength, "/1000");
    if (textLength > 1000) {
      this.counter.style.color = "red";
      this.counter.textContent = "".concat(
        textLength,
        "/1000 \u041F\u0440\u0435\u0432\u044B\u0448\u0435\u043D \u043B\u0438\u043C\u0438\u0442!"
      );
      this.sendButton.disabled = true;
    } else {
      this.counter.style.color = "#999999";
      this.sendButton.disabled = false;
    }
  };
  CommentSystem.prototype.getUser = function () {
    var _this = this;
    fetch("https://randomuser.me/api")
      .then(function (response) {
        return response.json();
      })
      .then(function (data) {
        var firstName = data.results[0].name.first;
        var lastName = data.results[0].name.last;
        var avatarUrl = data.results[0].picture.medium;
        var name = "".concat(firstName, " ").concat(lastName);
        window.srcName = name;
        window.srcAvatarUrl = avatarUrl;
        _this.userName.innerHTML = name;
        _this.userAva.src = avatarUrl;
      })
      .catch(function (error) {
        console.error("Ошибка подключения к randomuser.me:", error);
      });
  };
  CommentSystem.prototype.addComment = function () {
    if (!this.sendButton.disabled) {
      var text = this.textarea.value;
      if (!text) {
        return;
      }
      var currentDate = new Date();
      var date = ""
        .concat(currentDate.getDate(), ".")
        .concat(currentDate.getMonth() + 1, " ")
        .concat(currentDate.getHours(), ":")
        .concat(currentDate.getMinutes());
      var name_1 = window.srcName;
      var avatarUrl = window.srcAvatarUrl;
      var comment = new UserComment(
        name_1,
        "url(".concat(avatarUrl, ")"),
        date,
        text,
        "",
        false,
        0,
        0,
        this
      );
      this.textarea.value = "";
      this.updateCounter();
      if (this.replyToComment != null) {
        this.replyToComment.answers.push(comment);
        this.clearReply();
      } else {
        this.commentList.push(comment);
      }
      this.saveCommentsToLocalStorage();
      this.renderComments();
      this.getUser();
    }
  };
  CommentSystem.prototype.saveCommentsToLocalStorage = function () {
    var comments = [];
    this.commentList.forEach(function (box) {
      comments.push(box.toJSON());
    });
    localStorage.setItem("comments", JSON.stringify(comments));
  };
  CommentSystem.prototype.renderComments = function () {
    this.loadCommentsFromLocalStorage();
    var comments = [];
    Object.assign(comments, this.commentList);
    if (this.onlyFavorites) {
      var allComments_1 = [];
      comments.forEach(function (comment) {
        if (comment.favoriteButtonClass == "") {
          comment.answers.forEach(function (answer) {
            allComments_1.push(answer);
          });
        } else {
          allComments_1.push(comment);
        }
      });
      comments = allComments_1.filter(function (comment) {
        return comment.favoriteButtonClass !== "";
      });
    }
    var sortBy = this.selectedSort;
    var commentNumber = document.querySelector(".number");
    var number = comments.length;
    comments.forEach(function (comment) {
      number += comment.answers.length;
    });
    commentNumber.innerHTML = "(".concat(number, ")");
    if (sortBy === "date") {
      comments.sort(function (a, b) {
        return new Date(b.data).getTime() - new Date(a.data).getTime();
      });
    } else if (sortBy === "count") {
      comments.sort(function (a, b) {
        return parseInt(b.counterNumber) - parseInt(a.counterNumber);
      });
    } else if (sortBy === "actual") {
      comments.sort(function (a, b) {
        return parseInt(b.counterValue) - parseInt(a.counterValue);
      });
    } else if (sortBy === "answers") {
      comments.sort(function (a, b) {
        return parseInt(b.answers.length) - parseInt(a.answers.length);
      });
    }
    if (this.sortingOrder == "desc") {
      comments.reverse();
    }
    var resultComment = document.querySelector("#comment_res");
    if (resultComment) {
      resultComment.innerHTML = "";
      comments.forEach(function (comment) {
        resultComment.appendChild(comment.render());
      });
    }
  };
  CommentSystem.prototype.loadCommentsFromLocalStorage = function () {
    var _this = this;
    var comments = JSON.parse(localStorage.getItem("comments") || "[]");
    this.commentList = [];
    comments.forEach(function (commentData) {
      var answersArray = JSON.parse(commentData.answers || "[]");
      var answers = [];
      answersArray.forEach(function (ans) {
        var ansComment = new UserComment(
          ans.name,
          ans.ava,
          ans.data,
          ans.text,
          ans.favoriteButtonClass,
          ans.isVoted,
          parseInt(ans.counterValue),
          parseInt(ans.counterNumber),
          _this
        );
        answers.push(ansComment);
      });
      var comment = new UserComment(
        commentData.name,
        commentData.ava,
        commentData.data,
        commentData.text,
        commentData.favoriteButtonClass,
        commentData.isVoted,
        parseInt(commentData.counterValue),
        parseInt(commentData.counterNumber),
        _this,
        answers
      );
      _this.commentList.push(comment);
    });
  };
  return CommentSystem;
})();
window.addEventListener("DOMContentLoaded", function () {
  new CommentSystem();
});
