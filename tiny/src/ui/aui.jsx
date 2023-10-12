import { useState, useEffect } from "preact/hooks"

const colors = {
    error: "#FF0033"
}

export const Button = (props) => {
    const [object, setObject] = useState(null)

    useEffect(() => {
        const defaultObject = {
            type: "button",
            key: "",
            name: "",
            onClick: () => {},
            style: {},
            fullWidth: false,
            disabled: false,
            visible: true,
            variant: "",
            color: "",
            class: "default",
            size: "default",
        }

        const newObject = {...defaultObject, ...props}

        newObject.style['width'] = newObject.fullWidth ? '100%' : 'auto'
        newObject.style['display'] = newObject.visible ? 'block' : 'none'
        newObject.class = newObject.class + " " + newObject.variant + ' ' + newObject.color + ' ' + newObject.size

        setObject(newObject)
    }, [props])

    
    return (
        <>
            {
                object && 
                <button
                    key={object.key} 
                    type={object.type}
                    name={object.name}
                    onClick={object.onClick}
                    style={object.style}
                    disabled={object.disabled}
                    class={object.class}
                >
                    {object.children}
                </button> 
            }
        </>
    )
}

export const Input = (props) => {
    const [object, setObject] = useState(null)

    useEffect(() => {
        const defaultObject = {
            type: "text",
            placeholder: "",
            key: "",
            name: "",
            value: "",
            onChange: () => {},
            style: {},
            fullWidth: false,
            error: false,
            disabled: false,
            readOnly: false,
            required: false,
            step: 1,
            autoFocus: false,
            label: "",
        }

        const newObject = {...defaultObject, ...props}

        newObject.style['width'] = newObject.fullWidth ? '100%' : 'auto'
        newObject.style['borderColor'] = newObject.error ? colors.error : 'auto'

        setObject(newObject)
    }, [props])

    
    return (
        <>
            {
                object &&
                <div  
                    class="input"
                    style={object.style}
                >
                    {
                        object.label &&
                        <label htmlFor={object.name}>{object.label}</label>
                    }
                    {
                        <input
                            // label={label}
                            key={object.key} 
                            type={object.type}
                            placeholder={object.placeholder}
                            name={object.name}
                            value={object.value}
                            onInput={object.onChange}
                            style={object.style}
                            disabled={object.disabled}
                            readOnly={object.readOnly}
                            required={object.required}
                            step={object.step}
                            autoFocus={object.autoFocus}
                        /> 
                    }
                </div>
            }
        </>
    )
}

export const Select = (props) => {
    const [object, setObject] = useState(null)

    useEffect(() => {
        const defaultObject = {
            key: "",
            name: "",
            value: "",
            onChange: () => {},
            style: {},
            fullWidth: false,
            disabled: false,
            readOnly: false,
            required: false,
            autoFocus: false,
            children: []
        }

        const newObject = {...defaultObject, ...props}

        newObject.style['width'] = newObject.fullWidth ? '100%' : 'auto'

        setObject(newObject)
    }, [props])

    
    return (
        <>
            {
                object && 
                <select
                    key={object.key} 
                    name={object.name}
                    value={object.value}
                    onInput={object.onChange}
                    style={object.style}
                    disabled={object.disabled}
                    readOnly={object.readOnly}
                    required={object.required}
                    autoFocus={object.autoFocus}
                >
                    {object.children}
                </select> 
            }
        </>
    )
}

export const TextArea = (props) => {
    const [object, setObject] = useState(null)

    useEffect(() => {
        const defaultObject = {
            key: "",
            name: "",
            value: "",
            placeholder: "",
            onChange: () => {},
            style: {},
            fullWidth: false,
            error: false,
            disabled: false,
            readOnly: false,
            required: false,
            autoFocus: false,
            rows: 4,
            cols: 0,
            resize: false,
        }

        const newObject = {...defaultObject, ...props}

        newObject.style['width'] = newObject.fullWidth ? '100%' : 'auto'
        newObject.style['borderColor'] = newObject.error ? colors.error : 'auto'
        newObject.style['resize'] = newObject.resize ? 'vertical' : 'none'

        setObject(newObject)
    }, [props])

    
    return (
        <>
            {
                object && 
                <textarea
                    key={object.key} 
                    name={object.name}
                    placeholder={object.placeholder}
                    value={object.value}
                    onInput={object.onChange}
                    style={object.style}
                    disabled={object.disabled}
                    readOnly={object.readOnly}
                    required={object.required}
                    autoFocus={object.autoFocus}
                    rows={object.rows}
                    cols={object.cols}
                /> 
            }
        </>
    )
}

export const Dialog = (props) => {
    const [object, setObject] = useState(null)
    const [open, setOpen] = useState(false)

    const openDialog = () => {
        setOpen(true)
    }

    const closeDialog = () => {
        setOpen(false)
        if (object.onSubmit) {
            object.onSubmit()
        }
    }

    useEffect(() => {
        const defaultObject = {
            title: "",
            style: {},
            fullScreen: false,
            onSubmit: null,
            class: "dialog",
            buttonText: "",
            buttonSettings: {
                variant: "contained",
                color: "primary",
                size: "slim",
                fullWidth: false,
            }
        }

        const newObject = {...defaultObject, ...props}

        newObject.buttonText = newObject.buttonText === "" ? newObject.title : newObject.buttonText

        setObject(newObject)
    }, [props])
    
    return (
        <>
            {
                object && 
                <>
                    <div 
                        class={object.class + " " + (open ? "active" : "")}
                        style={object.style}
                    >
                        <div class={`overlay ${open ? "active" : ""}`} onClick={closeDialog}>

                        </div>

                        <div 
                            class={`content ${object.fullScreen ? "full-screen" : ""}`}
                        >
                            <div class="header mb-10">
                                <h3>{object.title}</h3>
                            </div>
                            {object.children}
                            <div class="footer">
                                <Button onClick={closeDialog}>Close</Button>
                                {
                                    object.onSubmit &&
                                    <Button 
                                        onClick={closeDialog}
                                        variant="contained"
                                        color="success"
                                    >Save</Button>
                                }
                            </div>
                        </div>
                        
                    </div>
                    
                    <Button
                        variant={object.buttonSettings.variant}
                        color={object.buttonSettings.color}
                        size={object.buttonSettings.size}
                        fullWidth={object.buttonSettings.fullWidth}
                        onClick={openDialog}
                    >
                        {object.buttonText}
                    </Button>
                </>
            }
        </>
    )
}

export const Form = (props) => {
    const [object, setObject] = useState(null)

    useEffect(() => {
        const defaultObject = {
            instance: {},
            style: {},
        }

        const newObject = {...defaultObject, ...props}

        setObject(newObject)

        console.log(newObject.instance)
    }, [props])

    const onChange = (e) => {
        const name = e.target.name
        let value = e.target.value

        if (typeof object.instance[name] === "number") {
            value = parseInt(value)
        } else if (typeof object.instance[name] === "boolean") {
            value = value === "true"
        }

        const newObject = {...object.instance}
        newObject[name] = value


        setObject({
            ...object,
            instance: newObject
        })
    }

    const onSubmit = (e) => {
        e.preventDefault()
        props.onSubmit(object.instance)
    }

    const Field = (name, value, type) => {
        const checkType = () => {
            if (typeof value === "number") {
                return "number"
            } else if (typeof value === "boolean") {
                return "checkbox"
            } else {
                // check if valid date
                var date = Date.parse(value)
                if (!isNaN(date)) {
                    return "date"
                }

                // check if valid email
                var email = value.includes("@")
                if (email) {
                    return "email"
                }

                return "text"
            }
        }

        return (
            <Input
                name={name}
                value={value}
                type={checkType()}
                onChange={onChange}
            />
        )
    }
    
    return (
        <>
            {
                object && 
                <form
                    style={object.style}
                    onSubmit={onSubmit}
                >
                    {
                        object.instance && Object.keys(object.instance).map((key) => {
                            const value = object.instance[key]
                            return (
                                <div>
                                    <label>{key}</label>
                                    {Field(key, value)}
                                </div>
                            )
                        })
                    }
                    

                    {object.children}
                    <Button 
                        type="submit"
                        variant="contained"
                        color="primary"
                    >
                        Save
                    </Button>
                </form>
            }
        </>
    )
}