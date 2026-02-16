// import React from "react";
// import axios from "axios";

// const MessageParser = ({ children, actions }) => {
//   const loadHistory = async () => {
//     try {
//       const response = await axios.get("http://127.0.0.1:8000/getHistory");
//       const fetchedMessages = response.data.history.map((msg) => ({
//         id: msg.msgId,
//         message: msg.message,
//         type: msg.type,
//         delay: msg.type === "bot" ? undefined : null,
//         loading: msg.type === "bot" ? false : null,
//       }));

//       if (fetchedMessages.length >= 1) {
//         actions.setState((prev) => ({
//           ...prev,
//           messages: fetchedMessages,
//         }));
//       }
//     } catch (error) {
//       console.log("Error in getting history:", error);
//     }
//   };

//   React.useEffect(() => {
//     loadHistory();
//   }, []);

//   const parse = async (message) => {
//     const responseHistory = actions.getHistory();

//     const contents = [];

//     responseHistory.forEach(([userMsg, botMsg]) => {
//       contents.push(
//         { role: "user", parts: [{ text: userMsg }] },
//         { role: "model", parts: [{ text: botMsg }] },
//       );
//     });

//     contents.push({
//       role: "user",
//       parts: [{ text: message }],
//     });

//     const jsonData = { contents };

//     const apiKey = "AIzaSyDFnlx9jS2a4Nwpu1FuK7q8E3aJNgFLpWg"; // Replace with your actual key

//     try {
//       actions.loadingMessage();

//       const resp = await axios.post(
//         "http://127.0.0.1:8000/askGemini/",
//         jsonData,
//         {
//           headers: {
//             "Content-Type": "application/json",
//           },
//         },
//       );

//       const botMessage = resp.data?.candidates?.[0]?.content?.parts?.[0]?.text;

//       actions.generateResponse(botMessage);
//     } catch (error) {
//       console.error(
//         "Error calling Gemini API:",
//         error.response?.data || error.message,
//       );
//       actions.errorMessage();
//     }
//   };

//   return (
//     <div>
//       {React.Children.map(children, (child) => {
//         return React.cloneElement(child, {
//           parse,
//           actions,
//         });
//       })}
//     </div>
//   );
// };

// // ✅ Properly exporting the defined component
// export default MessageParser;

import React, { useEffect, useState, useRef } from "react";
import axios from "axios";

const MessageParser = ({ children, actions }) => {
  // 🔒 Prevent multiple API calls
  const isSendingRef = useRef(false);
  const apiKey = "AIzaSyDFnlx9jS2a4Nwpu1FuK7q8E3aJNgFLpWg";

  // ✅ Load chat history
  const loadHistory = async () => {
    try {
      const response = await axios.get("http://127.0.0.1:8000/getHistory");

      const fetchedMessages = response.data.history.map((msg) => ({
        id: msg.msgId,
        message: msg.message,
        type: msg.type,
        delay: msg.type === "bot" ? undefined : null,
        loading: msg.type === "bot" ? false : null,
      }));

      if (fetchedMessages.length > 0) {
        actions.setState((prev) => ({
          ...prev,
          messages: fetchedMessages,
        }));
      }
    } catch (error) {
      console.log("Error fetching history:", error);
    }
  };

  // ✅ Runs only once safely
  useEffect(() => {
    loadHistory();
  }, []);

  // ✅ Parse user message
  const parse = async (message) => {
    // 🔒 Request lock
    if (isSendingRef.current) return;
    isSendingRef.current = true;

    try {
      const responseHistory = actions.getHistory();

      const contents = [];

      responseHistory.forEach(([userMsg, botMsg]) => {
        contents.push(
          { role: "user", parts: [{ text: userMsg }] },
          { role: "model", parts: [{ text: botMsg }] },
        );
      });

      contents.push({
        role: "user",
        parts: [{ text: message }],
      });

      const jsonData = { contents };

      // Show loading message
      actions.loadingMessage();

      const resp = await axios.post(
        "http://127.0.0.1:8000/askGemini/",
        jsonData,
        {
          headers: {
            "Content-Type": "application/json",
          },
        },
      );

      const botMessage =
        resp.data?.candidates?.[0]?.content?.parts?.[0]?.text ||
        "No response from AI.";

      actions.generateResponse(botMessage);
    } catch (error) {
      console.error("Gemini API Error:", error.response?.data || error.message);

      actions.errorMessage();
    } finally {
      // 🔓 Unlock request
      isSendingRef.current = false;
    }
  };

  return (
    <div>
      {React.Children.map(children, (child) => {
        return React.cloneElement(child, {
          parse,
          actions,
        });
      })}
    </div>
  );
};

export default MessageParser;
