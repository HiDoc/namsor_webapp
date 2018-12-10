var billingCurrencies = request({url : "billingCurrencies"})
var availablePlans = request({url : "availablePlans"})

var currentPlanName = function() {
  return new Promise(function(resolve, reject) {
    getApiKey().then(function(key) {
      request({
        url : 'apiUsage',
        headers : {"X-API-KEY" : key}
      }).then( data => resolve((JSON.parse(data))), error => reject(error))
    }, function(error) { reject(error) });
  });
}

function dataServicesToHTML(data, current, signedIn, currency)
{
  let html = '';
  data.plans.forEach( plan => {
    if (plan.planName != "ENTERPRISE") {
      html += `
      <div class="col-md-3 mb-3">
      <div class="card h-100">
      <h3 class="card-header">${plan.planName}</h3>
      <div class="card-body">
      <div class="display-4">${plan.price} <span class="small"> ${currency}</span></div>
      <div class="font-italic"></div>
      </div>
      <ul class="list-group list-group-flush">
      <li class="list-group-item">Plan quota : ${plan.planQuota}</li>
      <li class="list-group-item">Price overage : ${plan.priceOverage} </li>
      <li class="list-group-item">`;
      if (!signedIn) {
        html += `<button class="btn btn-primary">Sign in !</button>`;
      } else if (plan.planName == current) {
        html += `<button data-name="${plan.planName}" disabled id="current" class="btn btn-success">Current</button>`
      } else {
        html += `<button data-name="${plan.planName}"
        data-loading-text="<i class='fa fa-spinner fa-spin'></i> Processing Order"
        class="btn btn-primary">Subscribe!</button>`
      }
      html += `</li>
      </ul>
      </div>
      </div>
      `;
    }
  });
  return (html);
}

var insertServices = function(data, current, signedIn, currency) {
  return dataServicesToHTML(data, current, signedIn, currency);
}

var insertData = function(prep) {
  availablePlans.then( data => {
    const services = document.getElementById('services')
    let html = "";
    data = JSON.parse(data);
    currentPlanName().then(function(current) {
      current = current.subscription.planName;
      getToken().then(function (token) {
        getUsage().then(function(usage){
          usage = JSON.parse(usage);
          services.innerHTML = insertServices(data, current, true, usage.subscription.currency);
          if (usage.subscription.stripeStatus == 'active') {
            jQuery('#services').find('button').not('#current').click(function (event) {
              let p = "subscribePlan/" + this.dataset.name + "/" + token;
              var btn = $(this)
              this.innerHTML = '<i class="fa fa-spinner fa-spin"></i> Processing..';
              request({url : p}).then (
                function (planInfos) {
                  planInfos = JSON.parse(planInfos)
                  if (prep)
                  {
                    alertBox(
                      'You have successfuly register to ' + planInfos.planName,
                      'success',
                      services
                    );
                    btn.text(() => 'Success');
                    btn.toggleClass('btn-info');
                  }
                  setTimeout(function() {
                     insertData(true);
                  }, 3000);
                }, function (error) {
                  console.log(error)
                });
            });
          }
          else if (prep) {
            alertBox(
              'You have to register <a href="payments.html">here</a> your credit card before doing that',
              'warning',
              services
            );
          }
        });
      });
    }, function (error) {
      services.innerHTML = insertServices(data, '', false, 'USD');
      jQuery('#services').find('button').each(function (index, button) {
        button.textContent = 'Sign in !';
        button.addEventListener('click', function(event){
          document.getElementById('signin').click();
        });
      });
    });
  });
}
