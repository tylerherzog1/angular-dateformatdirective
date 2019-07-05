import { Directive, HostListener, ElementRef, Input, Optional, ChangeDetectorRef } from "@angular/core";
import { AbstractControl, NG_VALIDATORS, Validator, ValidationErrors, NgControl } from "@angular/forms";

/* Hours wasted here: 8
 *
 * */

@Directive({
    selector: '[dateInputFormat]',
    // "providers" is commented out because putting ngControl in the contructor as well, even with @Optional gave errors. 
    // Since external date validation is no longer needed, this is acceptable
    // providers: [
    //     { provide: NG_VALIDATORS, useExisting: DateInputFormatDirective, multi: true }
    // ]
}) export class DateInputFormatDirective {
    private regex = /(0\d{1}|1[0-2])\/([0-2]\d{1}|3[0-1])\/(19|20)\d{2}/;  //date format MM/DD/YYYY
    private digit = /\d/;
    private allow_01 = /[01]/;
    private allow_012 = /[012]/;
    private allow_0123 = /[0123]/;
    private allow_nonzero = /[123456789]/;
    private allow_non012 = /[34568789]/;
    private allow_non0123 = /[456789]/;
    private allow_12 = /[12]/; //also same for lateMonth
    private slash = /\//;

    constructor(
        private el: ElementRef,
        private readonly ngControl: NgControl = null //@Optional() 
    ) { }

    ///// THE FOLLOWING IS OBSOLETE: It remains for reference
    // ----------------------------------------------------------------------------------------------------------------------------- //
    // for date validation do the following in component:
    // @ViewChild('RecapDate', { read: ElementRef }) recapDateRef: ElementRef; 
    // in initialization : this.form.controls.TestDate.setValidators([new DateInputFormatDirective(this.testDateRef).validate()]);
    // in the html:
    // add #TestDate to the matInput
    // also add  <mat-error *ngIf="this.form.get('TestDate').hasError('invalidFormat')">
    //              <strong>Invalid format.Date format is MM / DD / YYYY.< /strong>
    //           </mat-error>
    // ----------------------------------------------------------------------------------------------------------------------------- //

    // Validation called on value change event which is emitted by angular's material datepicker
    // validate() {
    //     return (c: AbstractControl): { [key: string]: boolean } | null => {
    //         let errors = DateInputFormatDirective.dateFormatInputValidation(this.el);
    //         return errors;
    //     }
    // }

    // NOTE: using the dom value, not control. The control value is manipulated by material design - so
    // it can throw off the validation trying to be achieved
    // static dateFormatInputValidation(el: ElementRef): ValidationErrors | null {
    //     let domControl = el.nativeElement;
    //     return this.dateFormatValidation(domControl.value);
    // };

    // // Performs the actual validation based on the value
    // static dateFormatValidation(val: string): ValidationErrors | null {
    //     // skipping validation if no value entered
    //     if (val == null || val == '')
    //         return null;

    //     // validate if date pattern is MM/DD/YYYY
    //     //if (val.length == 8 && !val.indexOf('/'))
    //     //    val == val.substr(0, 2) + '/' + val.substr(2, 2) + '/' + val.substr(4, 4);

    //     // return error if the format was not correct - the keypress below formats MM/DD/YYYY.  But this check
    //     // will look at 1/1/2018 as valid just to ensure if this runs before formatter completes we don't cause an
    //     // invalid message.  Eventually it will be correct.  
    //     let regex: RegExp = /(0?\d{1}|1[0-2])\/([0-2]\d{1}|3[0-1]|\d{1})\/(19|20)\d{2}/;
    //     if (!regex.test(val))
    //         return { invalidFormat: true };

    //     // check if entry is a valid date - ei 2/31/2018 should fail
    //     let m = val.match(regex);
    //     let d = new Date(val);
    //     if (d.getMonth() + 1 == Number(m[1]) && d.getDate() == Number(m[2])) {
    //         return null;
    //     }
    //     return { invalidFormat: true };
    // }

    //For backspace and delete keys, although this works in Chrome it doesn't work consistently in IE (but blur still handles it)
    // @HostListener('keydown', ['$event']) handleKeydown(event) {
    //     //Trigger validation for backspace and delete
    //     if (event.keyCode.toString() == '8' || event.keyCode.toString() == '46') {
    //         if (this.ngControl && this.ngControl.control && this.ngControl.control.updateOn == 'change') {
    //             setTimeout(() => this.setErrors());
    //         }
    //     }
    // }

    // each keypress for the date is evaluated - will insert '0' where 1 digit month and/or day are entered
    // also evaluates for // which can occur if after initial entry the user removes the day from the date
    @HostListener('keypress', ['$event']) handleKeyboardInput(event) {
        let newKey = event.key.toString();
        let currentVal = this.el.nativeElement.value.toString();

        //stupid IE bug. IE treats the numberpad slash key as "Divide"
        if (newKey === 'Divide') {
            newKey = '/';
        }

        // as keypress is occurring - look at length to determine what is being entered.  Note that in the event
        // a date is already entered and the user removes/adds within the string (not the end) - this might cause
        // problems.  
        switch (this.el.nativeElement.value.toString().length) {
            case 0:
                if (this.allow_012.test(newKey)) {
                    return true;
                }
                else if (this.allow_non012.test(newKey)) {
                    //prefix, a zero, then allow
                    this.el.nativeElement.value = '0';
                    return true;
                }
                else {
                    return false;
                }
            case 1:
                if (currentVal == '0') {
                    //any digit is just a month
                    if (this.allow_nonzero.test(newKey)) {
                        return true;
                    }
                    else {
                        return false;
                    }
                }
                else if (currentVal == '1') {
                    //user typed a one
                    //if a slash key, auto insert perfix 0, allow slash
                    if (this.slash.test(newKey)) {
                        //prefix the digit with a zero, because user is moving on to the date
                        this.el.nativeElement.value = '0' + currentVal;
                        return true;
                    }
                    else if (this.allow_012.test(newKey)) {
                        //user typed a second digit for month, just permit it
                        return true;
                    }
                    else if (this.allow_non012.test(newKey)) {
                        //user typed a number that wasn't a 012, but still a digit, must be for day
                        //append a slash, prefix a zero
                        this.el.nativeElement.value = '0' + currentVal + '/';
                        return true;
                    }
                    else {
                        return false;
                    }
                }
                else if (this.digit.test(currentVal)) { //anything that's a 2-9; can just use digit regex since 0 and 1 handled above
                    //as long as it's valid digit, prefix and slahs
                    if (this.slash.test(newKey)) {
                        this.el.nativeElement.value = '0' + currentVal;
                        return true;
                    }
                    else if (this.digit.test(newKey)) {
                        this.el.nativeElement.value = '0' + currentVal + '/';
                        return true;
                    }
                    else {
                        return false;
                    }
                }
                else {
                    return false;
                }
            case 2:
                //if slash, allow
                if (this.slash.test(newKey)) {
                    return true; //just allow it to be typed 
                }
                else if (this.allow_0123.test(newKey)) {
                    //insert a slash before this key
                    this.el.nativeElement.value += "/";
                    return true;
                }
                else if (this.allow_non0123.test(newKey)) {
                    //all other numbers that aren't 0123
                    //insert a slash and zero prefix
                    this.el.nativeElement.value += "/0";
                    return true;
                }
                //the key wasn't a slash, and wasn't a valid digit, reject it 
                return false;
            case 3:
                //third char must be a slash, check for a 0123
                if (this.allow_0123.test(newKey)) {
                    return true; //don't assume what they want yet
                }
                else if (this.allow_non0123.test(newKey)) {
                    //assume a single digit day, prefix a zero
                    this.el.nativeElement.value += '0';
                    return true;
                }
                return false;
            case 4:
                //based on smart rules above, if length is 4, they've typed 0123 as 4th char
                //so if it's a 3, only allow a zero or 1, otherwise, any digit or slash
                if (currentVal.substring(currentVal.length - 1) == '3') {
                    //allow only 0 or 1 or slash
                    if (this.slash.test(newKey)) {
                        //prefix a zero which is tricky because the char already exists!
                        let slashIdx = currentVal.indexOf('/');
                        let lastChar = currentVal.substring(currentVal.length - 1);
                        this.el.nativeElement.value = currentVal.substring(0, slashIdx + 1) + '0' + lastChar;
                        return true;
                    }
                    else if (this.allow_01.test(newKey)) {
                        return true;
                    }
                    else if (this.allow_012.test(newKey)) {
                        //this must be a 2 (beacuse of preceeding else)
                        //prefix a zero and add a slash
                        let slashIdx = currentVal.indexOf('/');
                        let lastChar = currentVal.substring(currentVal.length - 1);
                        this.el.nativeElement.value = currentVal.substring(0, slashIdx + 1) + '0' + lastChar + '/';
                        return true;
                    }
                    else { //reject 3-9 as we are enforcing 4 digit years
                        return false;
                    }
                }
                else if (currentVal.substring(currentVal.length - 1) == '0') { //it's not a 3, su must be 012, 0 has rules for not allowing zero
                    //don't allow zeros
                    if (this.allow_nonzero.test(newKey)) {
                        return true;
                    }
                    else {
                        return false; //no slashes here bud
                    }
                }
                else { //not 3, not 0, must be 1 or 2
                    if (this.slash.test(newKey)) {
                        //prefix a zero which is tricky because the char already exists!
                        let slashIdx = currentVal.indexOf('/');
                        let lastChar = currentVal.substring(currentVal.length - 1);
                        this.el.nativeElement.value = currentVal.substring(0, slashIdx + 1) + '0' + lastChar;
                        return true; //allow the slash 
                    }
                    else if (this.digit.test(newKey)) {
                        return true;
                    }
                    else {
                        return false;
                    }
                }
            case 5:
                //if slash, allow,
                if (this.slash.test(newKey)) {
                    return true; //just allow it to be typed 
                }
                //else, make sure the next digit is a 1 or 2 
                else if (this.allow_12.test(newKey)) {
                    this.el.nativeElement.value += "/";
                    return true;
                }
                //the key wasn't a slash, and wasn't a valid digit, reject it 
                return false;
            case 6:
                //allow only a 1 or 2 first year digit 
                if (!this.allow_12.test(newKey)) {
                    return false;
                }
                return true;
            case 7:
            case 8:
            case 9:
                //allow any digit
                if (!this.digit.test(newKey)) {
                    return false;
                }
                return true;
            case 10:
                return false; //reject this char!
        }
    }

    //Only permit a proper date to paste
    @HostListener('paste', ['$event']) handlePastedInput(event) {
        //fetch the clipboard content to inspect
        let pastedValue = event.clipboardData.getData('Text');

        //verify the clipboard value is in the long numeric date format with slashes 
        if (!this.regex.test(pastedValue)) {
            alert(pastedValue + " is not a valid format date to be pasted into this field");
            return false;
        }

        // return true;
    }

    //Does a final validation once the field blurs, handy for backspace, delete, paste, and datePicker controls
    // @HostListener('blur', ['$event']) handleBlur(event) {
    //     this.setErrors();
    // }

    //Does the validation and immediately sets the error, or clears the error if there are no other errors.
    // setErrors() {
    //     let invalidFormat = DateInputFormatDirective.dateFormatValidation(this.el.nativeElement.value);

    //     if (!this.ngControl || !this.ngControl.control) {
    //         return;
    //     }
    //     let c = this.ngControl.control;
    //     //Always set the error if it is an actual error
    //     if (invalidFormat != null) {
    //         if (c.setErrors) {
    //             c.setErrors(invalidFormat);
    //         }
    //     } else if (c.errors && c.errors.invalidFormat || !c.errors) { //But only clear the error if there aren't other errors
    //         if (c.setErrors) {
    //             c.setErrors(null);
    //         }
    //     }
    // }

    // //This will return true (for keypress allowing keys) but will also set validation errors afterward using setTimeout
    // trueUpdateOn(): boolean {
    //     if (!this.ngControl || !this.ngControl.control) {
    //         return true;
    //     }
    //     if (this.ngControl.control.updateOn == 'change') {
    //         //We setTimeout because we need to use the input's value when the key is actually part of the value
    //         setTimeout(() => this.setErrors());
    //     }
    //     return true;
    // }
}
