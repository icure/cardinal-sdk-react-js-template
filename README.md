<p align="center">
    <a href="https://docs.icure.com">
        <img alt="icure-your-data-platform-for-medtech-and-ehr" src="https://icure.com/assets/icons/logo.svg">
    </a>
    <h1 align="center">iCure MedTech React JS Template</h1>
</p>

Start working on your e-health React JS app with iCure in a few minutes, by using our dedicated React JS template: 
```
git clone git@github.com:icure/icure-medical-device-react-js-boilerplate-app-template.git my-icure-app
cd my-icure-app && yarn
```

Once your app is created, rename the file `.env.default` to `.env`, complete the values it contains: 
- **VITE_MSG_GW_SPEC_ID**,
- **VITE_EMAIL_AUTHENTICATION_PROCESS_ID** and/or **VITE_SMS_AUTHENTICATION_PROCESS_ID**,
- **VITE_FRIENDLY_CAPTCHA_SITE_KEY**,
- **VITE_PARENT_HEALTHCARE_PROFESSIONAL_ID** (Optional)

And start your React app by executing `yarn dev`. 


Check out our [Quick Start](https://docs.icure.com/sdks/quick-start/) in order to know what are those information and how to get them from our [Cockpit Portal](https://cockpit.icure.cloud/).

*WARNING: Without these information, you won't be able to complete an authentication*

Looking for React Native template instead ? Head [here](https://github.com/icure/icure-medical-device-react-native-boilerplate-app-template).


## Requirements
Make sure the following tools are installed on your machine:
- [Yarn Package manager](https://yarnpkg.com/getting-started/install)
- [NodeJS](https://nodejs.org/en)


## Which technologies are used ? 
- [ReactJS](https://react.dev/)
- [Redux Toolkit](https://redux-toolkit.js.org/), as a state container
- [localForage](https://github.com/localForage/localForage), as an asynchronous Javascript storage
- [FriendlyCaptcha](https://friendlycaptcha.com/), as a CAPTCHA solution
- [Vite](https://vitejs.dev/) to generate our React project

We chosed this set of technologies, because we consider them as the most efficient ones to work with. 
Nonetheless, you can of course work with the technologies of your choices and still integrate the iCure MedTech Typescript SDK in your React JS app.


## What includes this template ?
- The [iCure MedTech Typescript SDK](https://github.com/icure/icure-medical-device-js-sdk) dependency; 
- A first implementation of the [iCure authentication flow](https://docs.icure.com/sdks/how-to/how-to-authenticate-a-user/how-to-authenticate-a-user) (Both registration and login).  


## What's next ? 
Check out our[MedTech Documentation](https://docs.icure.com/sdks/quick-start/react-js-quick-start) and more particularly our [How To's](https://docs.icure.com/sdks/how-to/index), in order to start implementing new functionalities inside your React JS App !
