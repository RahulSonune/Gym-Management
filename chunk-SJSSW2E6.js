function r(t,n="en-IN"){return t?(typeof t=="string"?new Date(t):t).toLocaleString(n,{day:"2-digit",month:"short",year:"numeric",hour:"2-digit",minute:"2-digit"}):"-"}export{r as a};
