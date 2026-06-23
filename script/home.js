document.addEventListener("DOMContentLoaded", () => {
    // ==========================================
    // 1. Search Box Logic
    // ==========================================
    const form = document.getElementById("searchbox");
    if (form) {
        const input = form.querySelector("input");
        form.addEventListener("submit", function(e){
            e.preventDefault(); // Prevents the page from reloading

            const value = input.value.toLowerCase().trim();
            if (value === "") return;

            if(value.includes("track") || value.includes("course")){
                document.getElementById("track").scrollIntoView({behavior:"smooth"});
            } else if(value.includes("start") || value.includes("journey")){
                document.getElementById("start-learn").scrollIntoView({behavior:"smooth"});
            } else if(value.includes("about")){
                document.getElementById("about").scrollIntoView({behavior:"smooth"});
            } else if(value.includes("contact")){
                const contactSec = document.getElementById("contact");
                if (contactSec) contactSec.scrollIntoView({behavior:"smooth"});
            } else {
                alert("Sorry, we couldn't find a section related to your search. Try 'tracks' or 'start'.");
            }
        });
    }


});
