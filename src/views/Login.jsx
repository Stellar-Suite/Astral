import { Dialog } from '../components/Dialog';
import { Wrapper } from '../components/Wrapper';
import React from 'react'
import { Input } from '../components/Input';
import { setApiUrl, getApiUrl } from '../utils/api';
import { checkHasBackend, tryLogin } from '../utils/api';
import { Button } from '../components/Button';
import { useNavigate } from 'react-router-dom';

// todo make inner reusable
const LoginPage = () => {

  let [apiUrl, setUiApiUrl] = React.useState(getApiUrl());
  let [stargateUrlValid, setStargateUrlValid] = React.useState(false);
 
  function checkStargateUrl(){
    checkHasBackend().then((hasBackend) => {
        if(hasBackend){
            setStargateUrlValid(true);
        }else{
            setStargateUrlValid(false);
        }
    });
  }

  React.useEffect(() => {
    checkStargateUrl();
  });

  function changeApiEndpoint(ev){
    setApiUrl(ev.target.value);
    setUiApiUrl(ev.target.value);
    checkStargateUrl();
  }

  let [isCheckingCreds, setIsCheckingCreds] = React.useState(false);
  let [hasInvalidCreds, setHasInvalidCreds] = React.useState(false);
  let [cred, setCred] = React.useState("");

  let navigate = useNavigate();

  function submitCredentials(ev){
    setIsCheckingCreds(true);
    tryLogin(cred).then((ok) => {
        if(ok){
            setHasInvalidCreds(false);
            navigate("/?ref=login");
        }else{
            setHasInvalidCreds(true);
        }
        setIsCheckingCreds(false);
    })
  }

  return <React.Fragment>
  <Wrapper>
    <Dialog>
        <div className="p-8 sm:p-12">
            <h1 className="text-4xl">Welcome to Astral</h1>
            <p className="text-lg">StarGate URL:</p>
            <Input type="url" placeholder="https://stargate.example.com" outline={stargateUrlValid ? "outline-lime-500" : "outline-rose-500"} 
            onChange={changeApiEndpoint} value={apiUrl} disabled={isCheckingCreds}
            className={"border-2 " + (stargateUrlValid ? "border-lime-500": "border-rose-500") } />
            <p className={"text-md mt-2 " + (stargateUrlValid ? "text-lime-500": "text-rose-500")}>{stargateUrlValid ? "This is a valid StarGate instance!": "This doesn't seem to be the url of a StarGate instance. Check your url and try again. "}</p>
            <p className="text-lg mt-4">Password: </p>
            <Input type="password" placeholder="" disabled={isCheckingCreds} value={cred} onChange={(ev) => setCred(ev.target.value)}></Input>
            {hasInvalidCreds && <>
                <p className="text-md text-rose-500 m-0">Invalid credentials. Please try again. </p>
            </>}
            <br />
            <Button variant={isCheckingCreds ? "warning": "success"} className={"mt-4"} disabled={isCheckingCreds} onClick={submitCredentials}>
                {
                    isCheckingCreds ? "Checking...": "Login"
                }
            </Button>
        </div>
    </Dialog>
    </Wrapper>
</React.Fragment>
};

export default LoginPage;