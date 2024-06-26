interface Window {
  srcName: string,
  srcAvatarUrl: string
}

class UserComment {
  public name: string;
  public ava: string;
  public data: string;
  public text: string;
  public favoriteButtonClass: string;
  public isVoted: boolean;
  public counterValue: number;
  public counterNumber: number;
  public commentSystem: CommentSystem;
  public answers: Array<UserComment>;
  private commentBox: HTMLElement;
  private favoriteButton: HTMLButtonElement;
  private counter: HTMLElement;
  private minusButton: HTMLButtonElement;
  private plusButton: HTMLButtonElement;

  constructor(
    name: string,
    ava: string,
    data: string,
    text: string,
    favoriteButtonClass: string,
    isVoted: boolean,
    counterValue: number,
    counterNumber: number,
    commentSystem: CommentSystem,
    answers: Array<UserComment> = []
  ) {
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

  private createCommentBox(): HTMLElement {
    const commentBox = document.createElement("div");
    commentBox.className = "block_com";
    commentBox.innerHTML = `
    <div class="src_com">
        <div class="ava" style='background-image: ${this.ava}'></div>
        <div class="com_aspects">
            <div class="com_name">${this.name}</div>
            <div class="com_data">${this.data}</div>
        </div>
        <div class="com_txt">${this.text}</div>
    </div>
    `;
    const replyButton = document.createElement("button");
    replyButton.className = "btn_reply";
    const img = document.createElement("img");
    img.src = "./svg/left.svg";
    img.className = "reply_icon";
    replyButton.addEventListener("click", () => {
      this.commentSystem.manageReply(this);
    });

    const buttonText = document.createTextNode("Ответить");
    replyButton.appendChild(img);
    replyButton.appendChild(buttonText);

    this.favoriteButton.className = "btn_favorite";
    this.favoriteButton.innerHTML = `
      <img src="./svg/heart.svg" class="heart ${this.favoriteButtonClass}"> Избранное
    `;

    this.favoriteButton.addEventListener("click", () => {
      const heartIcon = this.favoriteButton.querySelector(".heart");
      heartIcon?.classList.toggle("gray");
      this.favoriteButtonClass = heartIcon?.classList.contains("gray") ? "gray" : "";
      this.commentSystem.saveCommentsToLocalStorage();
    });

    const buttonContainer = document.createElement("div");
    buttonContainer.className = "cont_btn";

    buttonContainer.appendChild(replyButton);
    buttonContainer.appendChild(this.favoriteButton);

    const counterContainer = document.createElement("div");
    counterContainer.className = "counter_box";

    this.counter.className = "counter";
    this.counter.innerText = this.counterValue.toString();
    this.counter.style.color = this.counterValue >= 0 ? "green" : "red";

    this.minusButton.className = "counter_btn";
    this.minusButton.innerText = "-";
    this.minusButton.style.color = "red";
    this.minusButton.addEventListener("click", this.decrementCounter.bind(this));

    this.plusButton.className = "counter_btn";
    this.plusButton.innerText = "+";
    this.plusButton.style.color = "green";
    this.plusButton.addEventListener("click", this.incrementCounter.bind(this));

    counterContainer.appendChild(this.minusButton);
    counterContainer.appendChild(this.counter);
    counterContainer.appendChild(this.plusButton);

    buttonContainer.appendChild(counterContainer);
    commentBox.appendChild(buttonContainer);

    this.answers.forEach((comment) => {
      let rendered = comment.render();
      rendered.className = "block_com_reply";
      commentBox.appendChild(rendered);
    });

    return commentBox;
  }

  private decrementCounter() {
    if (this.isVoted){
      return;
    }
    this.isVoted = true;
    this.counterNumber += 1;

    this.counterValue -= 1;
    this.counter.innerText = this.counterValue.toString();
    this.counter.style.color = this.counterValue < 0 ? "red" : "green";
    this.commentSystem.saveCommentsToLocalStorage();
    this.commentSystem.renderComments();
  }

  private incrementCounter() {
    if (this.isVoted){
      return;
    }
    this.isVoted = true;
    this.counterNumber += 1;

    this.counterValue += 1;
    this.counter.innerText = this.counterValue.toString();
    this.counter.style.color = this.counterValue >= 0 ? "green" : "red";
    this.commentSystem.saveCommentsToLocalStorage();
    this.commentSystem.renderComments();
  }

  public render() {
    return this.commentBox;
  }

  public toJSON() {
    let answers: Array<any> = [];
    this.answers.forEach(ans => {
      answers.push(ans.toJSON());
    })
    return {
      name: this.name,
      ava: this.ava,
      data: this.data,
      text: this.text,
      favoriteButtonClass: this.favoriteButtonClass,
      isVoted: this.isVoted,
      counterValue: this.counterValue.toString(),
      counterNumber: this.counterNumber.toString(),
      answers: JSON.stringify(answers)
    };
  }
}

class CommentSystem {
  private textarea: HTMLTextAreaElement;
  private counter: HTMLElement;
  private sendButton: HTMLButtonElement;
  private dropDown: HTMLButtonElement;
  private arrow: HTMLImageElement;
  private dropdownContent: HTMLDivElement;
  private onlyFavoritesButton: HTMLSpanElement;
  private replyComment: HTMLDivElement;
  private replyCancel: HTMLSpanElement;
  private userName: HTMLLabelElement;
  private userAva: HTMLImageElement;

  private sortingOrder: string;
  private selectedSort: string;
  private onlyFavorites: boolean;
  private replyToComment: UserComment | null;

  private commentList: Array<UserComment>;

  constructor() {
    this.textarea = document.getElementById("comment_input") as HTMLTextAreaElement;
    this.counter = document.querySelector(".max_comment") as HTMLElement;
    this.sendButton = document.querySelector("#send_com") as HTMLButtonElement;
    this.dropDown = document.querySelector(".list_button") as HTMLButtonElement;
    this.arrow = document.querySelector(".arrow_down img") as HTMLImageElement;
    this.dropdownContent = document.querySelector(".list_cont") as HTMLDivElement;
    this.onlyFavoritesButton = document.querySelector(".favorite_txt") as HTMLSpanElement;
    this.replyComment = document.querySelector(".com_reply") as HTMLDivElement;
    this.replyCancel = document.querySelector(".cancel_reply") as HTMLSpanElement;
    this.userName = document.querySelector(".name_txt.max_name") as HTMLLabelElement;
    this.userAva = document.querySelector(".max_img img") as HTMLImageElement;

    this.sortingOrder = "asc";
    this.selectedSort = "date";
    this.commentList = [];
    this.onlyFavorites = false;
    this.replyToComment = null;
    this.getUser();
    this.init();
  }

  private init() {
    this.textarea.addEventListener("input", this.updateCounter.bind(this));
    this.sendButton.addEventListener("click", this.addComment.bind(this));
    this.dropDown.addEventListener("click", this.dropDownClick.bind(this));
    this.arrow.addEventListener("click", this.changeOrder.bind(this));
    this.dropdownContent.addEventListener("click", this.dropDownSelect.bind(this));
    this.onlyFavoritesButton.addEventListener("click", this.favoriteSort.bind(this));
    this.replyCancel.addEventListener("click", this.clearReply.bind(this));

    this.renderComments();
  }

  public manageReply(comment: UserComment) {

    this.textarea.focus();
    this.counter.scrollIntoView({ behavior: "smooth", block: "center" });

    this.replyComment.style.display = "block";
    let replyText = this.replyComment.querySelector(".to_reply") as HTMLSpanElement;
    replyText.innerText = `Ответ на ${comment.name}`;

    this.replyToComment = comment;

  }

  public clearReply() {
    this.replyToComment = null;
    this.replyComment.style.display = "none";
  }

  private dropDownClick() {
    const dropdownContent = this.dropDown.nextElementSibling as HTMLElement;
    dropdownContent.style.display = dropdownContent.style.display === "block" ? "none" : "block";
  }

  private favoriteSort() {
    this.onlyFavorites = !this.onlyFavorites;
    this.renderComments();
  }

  private changeOrder() {

    if (this.sortingOrder === "asc"){
      this.sortingOrder = "desc";
    } else {
      this.sortingOrder = "asc";
    }

    const arrow_down = document.querySelector(".arrow_down") as HTMLElement;
    arrow_down.classList.toggle("active");

    this.renderComments();
  }

  private dropDownSelect(event: MouseEvent) {
    var element = event.target as HTMLElement;
    if (element.tagName === "BUTTON") {
        document.querySelectorAll(".list_item").forEach((item) => item.classList.remove("selected"));
        element.classList.add("selected");

        document.querySelector(".list_button")!.textContent = element.textContent!;
        
        (this.dropdownContent as HTMLElement).style.display = "none";

        const selectedValue = element.getAttribute("data-value");
        this.selectedSort = selectedValue == null? "date" : selectedValue;
        this.renderComments();
    }
}

  private updateCounter() {
    const textLength = this.textarea.value.length;
    this.counter.textContent = `${textLength}/1000`;

    if (textLength > 1000) {
      this.counter.style.color = "red";
      this.counter.textContent = `${textLength}/1000 Превышен лимит!`;
      this.sendButton.disabled = true;
    } else {
      this.counter.style.color = "#999999";
      this.sendButton.disabled = false;
    }
  }
  
  private getUser() {
    fetch('https://randomuser.me/api')
    .then(response => response.json())
    .then(data => {
      const firstName = data.results[0].name.first;
      const lastName = data.results[0].name.last;
      const avatarUrl = data.results[0].picture.medium;
      const name = `${firstName} ${lastName}`;

      window.srcName = name;
      window.srcAvatarUrl = avatarUrl;
      this.userName.innerHTML = name;
      this.userAva.src = avatarUrl;
    })
    .catch(error => {
      console.error('Ошибка подключения к randomuser.me:', error);
    });
  }

  private addComment() {
    if (!this.sendButton.disabled) {
      const text = this.textarea.value;
      if (!text){
        return;
      }

      const currentDate = new Date();
      const date = `${currentDate.getDate()}.${currentDate.getMonth() + 1} ${currentDate.getHours()}:${currentDate.getMinutes()}`;
	  
	  
      let name = window.srcName;
      let avatarUrl = window.srcAvatarUrl;

      const comment = new UserComment(name, `url(${avatarUrl})`, date, text, "", false, 0, 0, this);

      this.textarea.value = "";
      this.updateCounter();

      if (this.replyToComment != null){
        this.replyToComment.answers.push(comment);
        this.clearReply();
      } else {
        this.commentList.push(comment);
      }

      this.saveCommentsToLocalStorage();
      this.renderComments()
			this.getUser();
    }
  }

  public saveCommentsToLocalStorage() {
    const comments: Array<any> = [];
    this.commentList.forEach((box) => {
      comments.push(box.toJSON());
    });

    localStorage.setItem("comments", JSON.stringify(comments));
  }

  public renderComments() {
    this.loadCommentsFromLocalStorage();

    let comments: Array<UserComment> = [];
    (<any>Object).assign(comments, this.commentList);

    if (this.onlyFavorites) {
      let allComments: Array<UserComment> = [];
      
      comments.forEach(comment => {
        if (comment.favoriteButtonClass == "") {
          comment.answers.forEach(answer => {
            allComments.push(answer);
          })
        } else {
          allComments.push(comment);
        }
      })

      comments = allComments.filter(comment => comment.favoriteButtonClass !== "");
    }

    let sortBy = this.selectedSort;
    const commentNumber = document.querySelector(".number") as HTMLElement;
    let number = comments.length;
    comments.forEach(comment => {
      number += comment.answers.length;
    })
    commentNumber.innerHTML = `(${number})`;

    if (sortBy === "date") {
      comments.sort((a: any, b: any) => {
            return new Date(b.data).getTime() - new Date(a.data).getTime();
        });
    } else if (sortBy === "count") {
        comments.sort((a: any, b: any) => {
            return parseInt(b.counterNumber) - parseInt(a.counterNumber);
        });
    } else if (sortBy === "actual") {
        comments.sort((a: any, b: any) => {
          return parseInt(b.counterValue) - parseInt(a.counterValue);
        });
    } else if (sortBy === "answers") {
        comments.sort((a: any, b: any) => {
          return parseInt(b.answers.length) - parseInt(a.answers.length);
        });
    }

    if (this.sortingOrder == "desc"){
      comments.reverse();
    }

    const resultComment = document.querySelector("#comment_res");
    if (resultComment) {
        resultComment.innerHTML = "";
        comments.forEach((comment) => {
            resultComment.appendChild(comment.render());
        });
    }

  }

  private loadCommentsFromLocalStorage() {
    let comments = JSON.parse(localStorage.getItem("comments") || "[]");
    this.commentList = [];
    comments.forEach((commentData: any) => {

      const answersArray = JSON.parse(commentData.answers || "[]");
      let answers: Array<UserComment> = [];

      answersArray.forEach((ans: any) => {
          const ansComment = new UserComment(
            ans.name,
            ans.ava,
            ans.data,
            ans.text,
            ans.favoriteButtonClass,
            ans.isVoted,
            parseInt(ans.counterValue),
            parseInt(ans.counterNumber),
            this
        );
        answers.push(ansComment);
      })

      const comment = new UserComment(
          commentData.name,
          commentData.ava,
          commentData.data,
          commentData.text,
          commentData.favoriteButtonClass,
          commentData.isVoted,
          parseInt(commentData.counterValue),
          parseInt(commentData.counterNumber),
          this,
          answers
      );
      this.commentList.push(comment);
    });
  }
}

window.addEventListener("DOMContentLoaded", () => {
  new CommentSystem();
});
