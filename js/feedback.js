// js/feedback.js

document.addEventListener('DOMContentLoaded', () => {
    const feedbackForm = document.getElementById('feedback-form');
    
    if (feedbackForm) {
        feedbackForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const btn = document.getElementById('fb-btn');
            const loader = document.getElementById('fb-loader');
            const textSpan = btn.querySelector('.btn-text');
            const successMsg = document.getElementById('feedback-success');

            // Simulate loading
            btn.disabled = true;
            if(textSpan) textSpan.classList.add('hidden');
            if(loader) loader.classList.remove('hidden');
            if(successMsg) successMsg.classList.add('hidden');

            setTimeout(() => {
                // Done loading
                btn.disabled = false;
                if(textSpan) textSpan.classList.remove('hidden');
                if(loader) loader.classList.add('hidden');
                
                // Show success
                if(successMsg) successMsg.classList.remove('hidden');
                feedbackForm.reset();
                
                // Optional: clear message after 5 seconds
                setTimeout(() => {
                    if(successMsg) successMsg.classList.add('hidden');
                }, 5000);

            }, 1200);
        });
    }
});
