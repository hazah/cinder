(function () {
  function createDatabase() {
    if ("indexedDB" in window) {
      let handle = window.indexedDB.open("database", 1);

      handle.addEventListener("success", (event) => {
        let db = event.target.result;

        db.addEventListener("error", (error) => {
          console.error("[Database Error]", error);
        });
      });

      handle.addEventListener("upgradeneeded", (event) => {
        let db = event.target.result;

        try {
          let greeting = db.createObjectStore("greeting", { autoIncrement: true });

          greeting.transaction.addEventListener("complete", (event) => {
            let greeting = db.transaction("greeting", "readwrite").objectStore("greeting");
            greeting.add({
              title: "Hello World!",
              content: "How are you today?"
            });
          });
        } catch (error) {
          console.error(error);
        }
      });

      handle.addEventListener("error", (error) => {
        console.error("[Could Not Open Database]", error);
      });
    }
  }

  createDatabase();
})();