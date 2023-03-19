import { useContext, useEffect, useState } from "react";
import { io } from "socket.io-client";
import { AuthContext } from "../../Database/context/AuthContext";
import styles from "./Social.module.css";

// const ENDPOINT = "http://localhost:5000";
const ENDPOINT = "https://seng-401-server.onrender.com";
const socket = io(ENDPOINT);

export default function Social() {
  const { user } = useContext(AuthContext);
  const [selectedChat, setSelectedChat] = useState("global");
  const [friends, setFriends] = useState([]);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);

  // Should eventually be stored in a context
  const userPlaceholder = {
    _id: "63f67ca701b010b2c4379399",
    name: "Rimuru Tempest",
    email: "rimuru@example.com",
    status: "ONLINE",
    rank: 7,
    friends: [],
    friendRequests: [],
    slime: {
      color: "green",
      face: "happy",
    },
    token:
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjYzZjY3Y2E3MDFiMDEwYjJjNDM3OTM5OSIsImlhdCI6MTY3NzA5ODE1MSwiZXhwIjoxNjc5NjkwMTUxfQ.gSXaeP1jQJN84qiWpvt2f5an7OxvHf5xEeytYV57bdw",
  };

  // Socket IO
  useEffect(() => {
    socket.emit("setup", userPlaceholder._id);

    socket.on("message", (newMessage) => {
      if (
        (newMessage.to === "global" && selectedChat === "global") ||
        selectedChat?._id === newMessage.to
      ) {
        setMessages((prev) => [newMessage, ...prev]);
      }
    });

    return () => {
      socket.removeAllListeners();
    };
  }, []);

  // Fetch friends
  useEffect(() => {
    const getFriends = async () => {
      const data = await fetch(`${ENDPOINT}/api/user/friends`, {
        headers: {
          Authorization: `Bearer ${userPlaceholder.token}`,
        },
      }).then((res) => res.json());

      setFriends(data);
    };

    getFriends();
  }, []);

  // Fetch messages for selected channel
  useEffect(() => {
    const getMessages = async () => {
      let channel;

      if (selectedChat) {
        if (selectedChat === "global") {
          // If user selected global chat
          channel = "global";
        } else {
          // If user selected friend
          channel = selectedChat._id;
        }

        const data = await fetch(`${ENDPOINT}/api/chat/${channel}`, {
          headers: {
            Authorization: `Bearer ${userPlaceholder.token}`,
          },
        }).then((res) => res.json());
        setMessages(data.reverse());
      }
    };

    getMessages();
  }, [selectedChat]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // If message has content and a chat is selected
    if (message && selectedChat) {
      const newMessage = {
        content: message,
        sender: userPlaceholder,
      };

      if (selectedChat === "global") {
        // Send message to global
        newMessage.to = "global";
      } else {
        // Send message to chat
        newMessage.to = selectedChat._id;
      }

      await fetch(`${ENDPOINT}/api/chat/${newMessage.to}`, {
        headers: {
          Authorization: `Bearer ${userPlaceholder.token}`,
          "Content-type": "application/json",
        },
        method: "post",
        body: JSON.stringify(newMessage),
      });

      setMessage("");
      socket.emit("message", newMessage);
    }
  };

  return (
    <div className={styles.social}>
      <section className={styles.leftSidebar}>
        <div className={styles.channels}>
          <div
            className={`${styles.global} ${selectedChat === "global" ? styles.selected : ""
              }`}
            onClick={() => setSelectedChat("global")}
          >
            <i className="material-symbols-outlined">public</i>
            <p>World</p>
          </div>
          <h2 className={styles.friendsHeader}>Friends</h2>
          <ul className={styles.friends}>
            {friends.map((friend, i) => (
              <li
                className={`${styles.friend} ${selectedChat === friend ? styles.selected : ""
                  }`}
                key={i}
                onClick={() => setSelectedChat(friend)}
              >
                <img src={user.data.slimePath} className={styles.slimeBody}></img>
                <div>
                  <p>{friend.name}</p>
                  <p className={`${styles.presence} ${styles[friend.status]}`}>
                    {friend.status}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className={styles.userStatus}>
          <img src={user.data.slimePath} className={styles.slimeBody}></img>
          <div>
            <p>{userPlaceholder.name}</p>
            <p className={`${styles.presence} ${styles.ONLINE}`}>ONLINE</p>
          </div>
        </div>
      </section>

      <section className={styles.chat}>
        <div className={styles.messages}>
          {selectedChat ? (
            messages.map((message, i) => {
              return (
                <div
                  className={`${styles.messageContainer} ${message.sender._id === userPlaceholder._id ? styles.mine : ""
                    }`}
                  key={i}
                >
                  <p className={styles.name}>{message.sender.name}</p>
                  <p className={styles.message}>{message.content}</p>
                </div>
              );
            })
          ) : (
            <div>Select a channel on the left to chat here.</div>
          )}
        </div>
        <form className={styles.messageForm} onSubmit={handleSubmit}>
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
          <button>
            <i className="material-symbols-outlined">send</i>
          </button>
        </form>
      </section>

      <section className={styles.rightSidebar}>
        {selectedChat && selectedChat !== "global" ? (
          <>
            <p>{selectedChat.name}</p>
            <img src={user.data.slimePath} className={styles.slimeBody}></img>
            <p>Rank {selectedChat.rank}</p>
          </>
        ) : (
          <div className={styles.World}>
            <p>World chat</p>
            <i className="material-symbols-outlined">public</i>
          </div>
        )}
      </section>
    </div>
  );
}
