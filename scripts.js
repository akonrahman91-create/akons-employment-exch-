// scripts.js - demo client-side logic (replace payment gateway URL)
(function(){
  const paymentGateway = "https://your-single-payment-gateway.example"; // replace with your real gateway URL

  // Sign-in flow (demo - stores locally)
  document.addEventListener('DOMContentLoaded', function(){

    // sign-in page handler
    const siBtn = document.getElementById('siBtn');
    if(siBtn){
      siBtn.addEventListener('click', function(){
        const name = document.getElementById('si_name').value.trim();
        const mobile = document.getElementById('si_mobile').value.trim();
        if(!name || !mobile){ alert('Please enter name and mobile'); return; }
        localStorage.setItem('signedIn', JSON.stringify({name: name, mobile: mobile}));
        alert('Signed in as ' + name);
        location.href = 'index.html';
      });
    }

    // prefill jobseeker form from signed in user
    const signed = JSON.parse(localStorage.getItem('signedIn')||'null');
    if(signed){
      const name = document.getElementById('name');
      const mobile = document.getElementById('mobile');
      if(name && !name.value) name.value = signed.name;
      if(mobile && !mobile.value) mobile.value = signed.mobile;
    }

    // search page logic (employer)
    const searchBtn = document.getElementById('searchBtn');
    if(searchBtn){
      searchBtn.addEventListener('click', function(){
        const skill = (document.getElementById('searchSkill').value||'').toLowerCase().trim();
        const city = (document.getElementById('searchCity').value||'').toLowerCase().trim();
        const state = (document.getElementById('searchState').value||'').toLowerCase().trim();
        const results = sampleProfiles.filter(function(p){
          if(skill && !(p.skill.toLowerCase().includes(skill) || (p.category && p.category.toLowerCase().includes(skill)))) return false;
          if(city && p.city.toLowerCase() !== city) return false;
          if(state && p.state.toLowerCase() !== state) return false;
          return true;
        });
        renderResults(results);
      });
    }

    // pay button handlers present on pages: openPayment(amount, purpose)
    window.openPayment = function(amount, purpose){
      const signed = JSON.parse(localStorage.getItem('signedIn')||'null');
      if(!signed){ alert('Please sign in first.'); location.href='signin.html'; return; }
      // create pending action and open payment gateway in new tab (gateway should redirect back to thankyou.html)
      const pending = {amount: amount, purpose: purpose, user: signed, timestamp: Date.now()};
      localStorage.setItem('pendingPayment', JSON.stringify(pending));

      // For contact unlock, also store which worker was selected (if set)
      // In this demo, we'll assume the employer clicked Pay from the worker card, which set pendingContact
      const returnUrl = location.origin + '/thankyou.html';
      const url = (paymentGateway || '#') + '?amount=' + encodeURIComponent(amount) + '&purpose=' + encodeURIComponent(purpose) + '&returnUrl=' + encodeURIComponent(returnUrl);
      window.open(url, '_blank');
      alert('Payment page opened in a new tab. After paying, return to the site to confirm.');
    }

    // On thankyou page show unlocked contact if pendingContact present
    const unlockedEl = document.getElementById('unlockedContact');
    if(unlockedEl){
      const pendingContact = JSON.parse(localStorage.getItem('pendingContact')||'null');
      if(pendingContact){
        unlockedEl.innerHTML = '<h3>Unlocked Contact</h3>' +
          '<p><strong>' + pendingContact.name + '</strong></p>' +
          '<p>Mobile: ' + pendingContact.mobile + '</p>' +
          '<p>City: ' + pendingContact.city + ', ' + pendingContact.state + '</p>';
        // Optionally remove pendingContact so it doesn't stay visible forever:
        // localStorage.removeItem('pendingContact');
      } else {
        unlockedEl.innerHTML = '<p class="muted">No contact was unlocked with this payment (demo mode).</p>';
      }
    }

    // employer post form - after submit we just alert (Formspree will receive details)
    const postForm = document.getElementById('postForm');
    if(postForm){
      postForm.addEventListener('submit', function(){ alert('Employer post submitted. Check your email for confirmation.'); });
    }

    // toggle other fields
    window.toggleOther = function(selectId, otherId){
      var val = document.getElementById(selectId).value;
      var other = document.getElementById(otherId);
      if(val === 'Other') other.style.display = 'block'; else other.style.display = 'none';
    }

    // render sample profiles on homepage (if any)
    var sc = document.getElementById('sample-cards');
    if(sc && window.sampleProfiles){
      sampleProfiles.forEach(function(p){
        var d=document.createElement('div'); d.className='card'; d.innerHTML='<h4>'+p.name+' — '+p.skill+'</h4><p><strong>Location:</strong> '+p.city+', '+p.state+'</p><p><strong>Experience:</strong> '+p.exp+' yrs · <strong>Type:</strong> '+p.type+'</p>'; sc.appendChild(d);
      });
    }

    // render results utility for employers page
    window.renderResults = function(list){
      var container = document.getElementById('results');
      if(!container) return;
      container.innerHTML = '';
      if(list.length === 0){ container.innerHTML = '<p class="muted">No workers matched your search.</p>'; return; }
      list.forEach(function(p){
        var div = document.createElement('div');
        div.className = 'card';
        div.innerHTML = '<h4>'+p.name+' — '+p.skill+'</h4>' +
          '<p><strong>Location:</strong> '+p.city+', '+p.state+'</p>' +
          '<p><strong>Gender / Age:</strong> '+(p.gender||'—')+' / '+(p.age||'—')+'</p>' +
          '<p><strong>Experience:</strong> '+p.exp+' yrs · <strong>Type:</strong> '+p.type+'</p>' +
          '<div style="margin-top:8px;"><button class="btn" onclick="viewContact(\''+p.id+'\')">View Contact (₹2)</button></div>';
        container.appendChild(div);
      });
    }

    // sample profiles used across pages
    window.sampleProfiles = [
      {id:'p1', name:'Ramesh Kumar', age:28, gender:'Male', city:'Guwahati', state:'Assam', skill:'Electrician', category:'Construction', exp:5, type:'Full-Time', mobile:'9000000001'},
      {id:'p2', name:'Saira Begum', age:24, gender:'Female', city:'Guwahati', state:'Assam', skill:'Housekeeping', category:'Hospitality', exp:2, type:'Part-Time', mobile:'9000000002'},
      {id:'p3', name:'Amit Das', age:32, gender:'Male', city:'Kolkata', state:'West Bengal', skill:'IT Support', category:'IT', exp:6, type:'Full-Time', mobile:'9000000003'},
      {id:'p4', name:'Latha Priya', age:36, gender:'Female', city:'Chennai', state:'Tamil Nadu', skill:'Teaching', category:'Education', exp:8, type:'Full-Time', mobile:'9000000004'}
    ];

    // viewContact: employer wants to view contact - require sign-in and then open payment for ₹2, and save which contact to unlock
    window.viewContact = function(profileId){
      var signed = JSON.parse(localStorage.getItem('signedIn')||'null');
      if(!signed){ alert('Please sign in first.'); location.href='signin.html'; return; }
      var prof = sampleProfiles.find(function(x){ return x.id === profileId; });
      if(!prof){ alert('Profile not found'); return; }
      // set pendingContact to be unlocked after payment
      localStorage.setItem('pendingContact', JSON.stringify(prof));
      // open payment for ₹2
      window.openPayment('2','view_contact_' + profileId);
    }

    // on load, if there's a pendingPayment and purpose starts with view_contact, show message
    var pending = JSON.parse(localStorage.getItem('pendingPayment')||'null');
    if(pending){ console.log('Pending payment found', pending); }
  });
})();